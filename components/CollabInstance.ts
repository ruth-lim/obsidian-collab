import { Notice, TFile, WorkspaceLeaf} from 'obsidian';
import MyPlugin from 'main';
import { CollabView } from './CollabView';
import { io, Socket} from "socket.io-client";

enum SocketIntention { //This is for checking connection status, if we're planning to do periodic health checks.
    Resting = -1,
    Connecting = 0,
    Connected = 1
}


/**
 * TODO: 
 * 
 * 1. CollabLoadingView
 * 2. Handle files with same name
 * 3. Handle Collab
 * 
 */
export class CollabInstance  {
    socketIntention: SocketIntention;
    socket: Socket;
    plugin: MyPlugin;
    file: TFile;
    leaf: WorkspaceLeaf;

	constructor(plugin: MyPlugin, socket: Socket) {
        this.socketIntention = SocketIntention.Resting;
        this.plugin = plugin;
        this.socket = socket;
        console.log(this.socket.id)
        this.socket.on("update", (data: string) => {
            this.handleUpdate(data);
        });
        this.socket.on("init", (data: string) => {
            console.log(`Received init event. Data: ${data}`)
            this.handleInit(data);
        });
	}

    async handleUpdate(raw_data: string) {
        console.log('Received message:', raw_data);
        let data = JSON.parse(raw_data);
    }

    async handleInit(raw_data: string) {
        console.log(`Tring to see file in handleInit: ${this.file}`);
        let data = JSON.parse(raw_data);
        this.createPage(data);
    }

    async open() {
        let entryPromise = this.handleEntry();
        await entryPromise;
        // Do the collab??
    }

    async handleEntry() { 
        const DEV_FILE_NAME = "Collab_Loading.md";
		await this.plugin.app.vault.create(DEV_FILE_NAME, "Loading...").then( 
            /**
             * By right this should be a html page (maybe CollabLoadingView or sth) so we can reload the connection. 
             * If CollabLoadingView is implemented, rmb to edit CollabView as well. 
             * 
             */
			tmp_file => { 
				this.leaf = this.plugin.app.workspace.getLeaf('tab');
				let _view = new CollabView(this.leaf);
                _view.init(DEV_FILE_NAME, this.socket);
				this.leaf.open(_view);
				let file = this.plugin.app.vault.getFileByPath(DEV_FILE_NAME);
				if (file) {
                    this.file = file;
					this.leaf.openFile(file);
				}
                console.log(`Tring to see file in handleEntry: ${this.file}`);
			}
		)
        console.log(this.socket.id);
        this.socket.emit("init", "ready");
	}

    async createPage(data: any) { //dict
        this.leaf.detach();
        
        await this.plugin.app.vault.create(data["title"], data["content"]).then(  // Create tmp file for editing. TODO handle conflicting files
			tmp_file => {
				this.leaf = this.plugin.app.workspace.getLeaf('tab');
				let _view = new CollabView(this.leaf);
                _view.init(data["title"], this.socket);
				this.leaf.open(_view);
				let file = this.plugin.app.vault.getFileByPath(data["title"]);
				if (file) {
                    this.file = file;
					this.leaf.openFile(file);
				}
                console.log(`Tring to see file in handleEntry: ${this.file}`);
			}
		)
    }
}