import {Update, receiveUpdates, sendableUpdates, collab, getSyncedVersion} from "@codemirror/collab";
import {basicSetup} from "codemirror";
import {ChangeSet, EditorState, Text} from "@codemirror/state";
import {EditorView, ViewPlugin, ViewUpdate} from "@codemirror/view";

import { Socket } from "socket.io-client";


/**
 * INCOMPLETE
 * 
 * This entire collab thing relies on 2 things.
 * 1. The client sends his updates to authority.
 * 2. Authority updates the doc.
 * 3. Authority resends the updates.
 * 4. All clients continually poll the server and update their version (incl the guy that updated) -> not elegant, will probably shift to yjs
 */


function pushUpdates(
    socket: Socket,
    version: number,
    fullUpdates: readonly Update[]
    ): void {
    // Strip off transaction data
    let updates = fullUpdates.map(u => ({
        clientID: u.clientID,
        changes: u.changes.toJSON()
    }));
    socket.emit("update", {type: "pushUpdates", version, updates});
    }
    
async function pullUpdates(
    socket: Socket,
    version: number
    ): Promise<readonly Update[]> {
    const a: Update[] = [];
    return a;
    }


export function peerExtension(startVersion: number, socket: Socket) {
    let plugin = ViewPlugin.fromClass(class {
        private pushing = false;
        private done = false;

        constructor(private view: EditorView) { 
            this.pull();
            socket.on("update", (data: string) => {
                this.handleUpdate(data); 

            });
        }

        
        async handleUpdate(raw_data: string) {
            console.log('Received message:', raw_data);
            let version = getSyncedVersion(this.view.state);
            let updates = await pullUpdates(socket, version);
            this.view.dispatch(receiveUpdates(this.view.state, updates));
        }
        
        update(update: ViewUpdate) {
            if (update.docChanged) {
                this.push();
            }
        }
    
        async push() {
            let updates = sendableUpdates(this.view.state);
            if (this.pushing || !updates.length) {
                return;
            }
            this.pushing = true;
            let version = getSyncedVersion(this.view.state);
            pushUpdates(socket, version, updates);
            this.pushing = false;
            // Regardless of whether the push failed or new updates came in
            // while it was running, try again if there's updates remaining
            if (sendableUpdates(this.view.state).length) {
                setTimeout(() => this.push(), 100);
            }
            console.log(`Pushed ${updates}`);
        }
        async pull() {
            // while (!this.done) {
                let version = getSyncedVersion(this.view.state);
                let updates = await pullUpdates(socket, version);
                this.view.dispatch(receiveUpdates(this.view.state, updates));
            // }
        }
    
        destroy() {
            this.done = true;
        }
    });
    return [collab({startVersion}), plugin]
}
