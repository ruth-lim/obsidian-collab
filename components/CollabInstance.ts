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
 * 1. CollabLoadingView
 * 2. Handle files with same name
 * 3. Handle Collab
 * 
 */
export class CollabInstance  {
    socketIntention: SocketIntention;
    socket: WebSocket | null;
    intendedUrl: string;
    plugin: MyPlugin;
    file: TFile;
    leaf: WorkspaceLeaf;

	constructor(plugin: MyPlugin, urlString: string){
        this.socketIntention = SocketIntention.Resting;
        this.plugin = plugin;
        this.intendedUrl = urlString;
	}

    async open() {
        let entryPromise = this.handleEntry();
        await entryPromise;
        let socketPromise = this.initSocket(); //socket onMessage funtions are declared here
        await socketPromise; 

        if(this.socket) {
            new Notice(`You are now connected to ${this.intendedUrl}!`); 
        } else {
            new Notice(`Was not able to connect to ${this.intendedUrl}!`);
        }
    }

    async handleEntry() { 
		new Notice(`You are attempting to connect to ${this.intendedUrl}!`);
        const DEV_FILE_NAME = "Collab_Connecting.md";


		await this.plugin.app.vault.create(DEV_FILE_NAME, "Connecting...").then( //By right this should be a html page (maybe CollabLoadingView or sth) so we can reload the connection. 
			tmp_file => { 
				this.leaf = this.plugin.app.workspace.getLeaf('tab');
				let _view = new CollabView(this.leaf);
                _view.init(DEV_FILE_NAME);
				this.leaf.open(_view);
				let file = this.plugin.app.vault.getFileByPath(DEV_FILE_NAME);
				if(file) {
                    this.file = file;
					this.leaf.openFile(file);
				}
                console.log(`Tring to see file in handleEntry: ${this.file}`);
			}
		)
	}

    async initContent() {
        let response = await fetch(this.intendedUrl);
        return await response.json();
    }

    async createPage(data: any) { //dict
        this.leaf.detach();
        
        await this.plugin.app.vault.create(data["title"], data["content"]).then(  // Create tmp file for editing. TODO handle conflicting files
			tmp_file => {
				this.leaf = this.plugin.app.workspace.getLeaf('tab');
				let _view = new CollabView(this.leaf);
                _view.init(data["title"]);
				this.leaf.open(_view);
				let file = this.plugin.app.vault.getFileByPath(data["title"]);
				if(file) {
                    this.file = file;
					this.leaf.openFile(file);
				}
                console.log(`Tring to see file in handleEntry: ${this.file}`);
			}
		)
    }

    async initSocket() {
		try {
			this.socketIntention = SocketIntention.Connecting;
			this.socket = new WebSocket(this.intendedUrl);
			this.socket.onopen = () => {
				console.log('Connected to the WebSocket server.');
				this.socketIntention = SocketIntention.Connected;
			}

			this.socket.onmessage = event => {
				console.log('Received message:', event.data);
                let data = JSON.parse(event.data);
                if(data["firstMessage"]) {
                    console.log(`Tring to see file in socket.onmessage: ${this.file}`);
                    this.createPage(data);
                }
			};
            
			// Closed
			this.socket.onclose = () => {
				console.log('Disconnected from the WebSocket server.');
				this.socket = null;
				this.socketIntention = SocketIntention.Resting;
			};
		}
		catch { 
			this.socket = null;
		}

	}

}