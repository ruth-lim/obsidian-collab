import { Notice, TFile, WorkspaceLeaf} from 'obsidian';
import MyPlugin from 'main';
import { CollabView } from './CollabView';

enum SocketIntention { //This is for checking connection status, if we're planning to do periodic health checks.
    Resting = -1,
    Connecting = 0,
    Connected = 1
}


/**
 * TODO:
 * 1. Figure out how to time socket.onMessage with loading screen
 * 2. CollabLoadingView
 * 3. Handle files with same name
 * 4. Handle Collab
 * 
 */
export class CollabInstance  {
    socketIntention: SocketIntention;
    socket: WebSocket;
    plugin: MyPlugin;
    file: TFile;
    leaf: WorkspaceLeaf;

	constructor(plugin: MyPlugin, socket: WebSocket) {
        this.socketIntention = SocketIntention.Resting;
        this.plugin = plugin;
        this.socket = socket;
        this.socket.onmessage = this.handleMessage.bind(this);
	}

    async handleMessage(event: MessageEvent) {
        console.log('Received message:', event.data);
        let data = JSON.parse(event.data);
        if(data["firstMessage"]) {
            console.log(`Tring to see file in socket.onmessage: ${this.file}`);
            this.createPage(data);
        }
    }
    async open() {
        let entryPromise = this.handleEntry();
        await entryPromise;
        // Do the collab??
    }

    async handleEntry() { 
		new Notice(`You are connected to ${this.socket.url}!`);
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
                _view.init(DEV_FILE_NAME, null);
				this.leaf.open(_view);
				let file = this.plugin.app.vault.getFileByPath(DEV_FILE_NAME);
				if (file) {
                    this.file = file;
					this.leaf.openFile(file);
				}
                console.log(`Tring to see file in handleEntry: ${this.file}`);
			}
		)

        this.socket.send("ready");
	}

    async initContent() {
        let response = await fetch(this.socket.url);
        return await response.json();
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