import { View, TFile, WorkspaceLeaf} from 'obsidian';
import MyPlugin from 'main';
import { CollabView } from './CollabView';
import { CollabLoadingView, COLLAB__LOADING_VIEW } from './CollabLoadingView';
import { io, Socket} from "socket.io-client";

export enum SocketIntention { //This is for checking connection status, if we're planning to do periodic health checks.
    Disconnected = -1,
    Loading = 0,
    Loaded = 1
}


/**
 * TODO: 
 * 
 * 1. Handle files with same name
 * 2. Handle Collab
 * 
 */
export class CollabInstance  {
    socketIntention: SocketIntention;
    socket: Socket;
    plugin: MyPlugin;
    file: TFile;
    leaf: WorkspaceLeaf;
    loadingView: CollabLoadingView;
    view: CollabView;

	constructor(plugin: MyPlugin, socket: Socket) {
        this.socketIntention = SocketIntention.Loading;
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
        this.leaf = this.plugin.app.workspace.getLeaf('tab');
        this.loadingView = new CollabLoadingView(this.leaf);
        await this.loadingView.init(this.socket);
        await this.loadingView.setLoadingState(SocketIntention.Loading);
        this.leaf.open(this.loadingView);
        await this.leaf.setViewState({ type: COLLAB__LOADING_VIEW, active:true });
        console.log(this.socket.id);
        this.socket.emit("init", "ready");
	}

    async createPage(data: any) { //dict
        this.loadingView.setLoadingState(SocketIntention.Loaded);
        this.leaf.detach();
        console.log("Loading leaf detached");
        let title = await this.getTitle(data["title"]);
        await this.plugin.app.vault.create(title, data["content"]).then(  // Create tmp file for editing. TODO handle conflicting files
			tmp_file => {
				this.leaf = this.plugin.app.workspace.getLeaf('tab');
				this.view = new CollabView(this.leaf);
                this.view.init(title, this.socket);
				this.leaf.open(this.view);
				let file = this.plugin.app.vault.getFileByPath(title);
				if (file) {
                    this.file = file;
					this.leaf.openFile(file);
				}
                console.log(`Tring to see file in handleEntry: ${this.file}`);
			}
		)
    }

    async getTitle(requestedTitle: string) {
        /**
         * To handle duplicate titles
         */

        let mdFiles = this.plugin.app.vault.getMarkdownFiles();
        let extension = requestedTitle.substring(requestedTitle.length - 2, requestedTitle.length);
        let name = requestedTitle.substring(0, requestedTitle.length);
        let exists = false;
        for (let i = 0; i < mdFiles.length; i++) {
            if (mdFiles[i].name.match(`${name}.${extension}`)) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            return `${name}.${extension}`;
        }

        let mod = 1 
        while (exists) {
            exists = false;
            for (let i = 0; i < mdFiles.length; i++) {
                if (mdFiles[i].name.match(`${name} (${mod}).${extension}`)) {
                    exists = true;
                    mod++;
                    break;
                }
            }
        }
        return `${name} (${mod}).${extension}`;
        
    }
}