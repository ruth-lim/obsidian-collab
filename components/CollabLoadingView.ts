import {ItemView , WorkspaceLeaf, TFile} from 'obsidian'
import { Socket } from "socket.io-client";
import { SocketIntention } from './CollabInstance';

export const COLLAB__LOADING_VIEW = 'collab-loading-view'
export class CollabLoadingView extends ItemView  {
    title: string;
    socket: Socket;
    state: SocketIntention;

    constructor(leaf: WorkspaceLeaf) {
        super(leaf);
    }
    getViewType() {
        return COLLAB__LOADING_VIEW;
    }
    getDisplayText(): string {
        return "Loading...";
    }
    async init(socket: Socket) {
        this.socket = socket;
    }

    async setLoadingState(state: SocketIntention) {
        this.state = state;
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('div', {cls: 'parent'})
        container.createEl('div', {cls: 'child loader'})
        container.createEl('h4', { text: 'Loading', cls: 'child loading' });
    }

    async onClose() {
        if (this.state !== SocketIntention.Loaded) {
            console.log('Websocket closed');
            this.socket.close();
            this.socket.off();
        }
    }

}