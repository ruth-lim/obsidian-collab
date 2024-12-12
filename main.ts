import { App, Editor, Notice, Modal, Plugin, PluginSettingTab, Setting, Vault, WorkspaceLeaf, MarkdownView, ItemView, TFile,} from 'obsidian';

/** 
 * TODO:
 * 1. HANDLE THE COLLAB???
 */
interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}
enum SocketIntention {
	Resting = -1,
	Connecting = 0,
	Connected = 1
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	statusBar: HTMLElement;
	socket: WebSocket | null;
	socket_intention: SocketIntention
	intended_url: string | null
	async onload() {
		await this.loadSettings()
		this.socket_intention = SocketIntention.Resting
		// This creates an icon in the left ribbon.
		this.statusBar = this.addStatusBarItem();
		this.registerView(
			COLLAB_VIEW,
			(leaf) => new CollabView(leaf)
		);
		const ribbonIconEl = this.addRibbonIcon('cable', 'Collab', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('Work In Progress!');
			new InputUriModal(this.app, (str) => {
				new Notice(`You attempted to connect to ${str}!`)
				this.init_socket(str);
				this.intended_url = str;
				this.app.vault.create("Collab_Connecting.md", "Loading...").then(
					tmp_file => {
						let leaf = this.app.workspace.getLeaf('tab');
						console.log(leaf.getViewState());
						leaf.openFile(tmp_file);
						console.log(leaf.getViewState());
						leaf.setViewState({type: COLLAB_VIEW, active: true});
						console.log(leaf.getViewState());
						this.app.workspace.revealLeaf(leaf);
					}
				)			
			}).open()
		});
		// test 'ws://localhost:8080'
		this.registerInterval(
		window.setInterval(
			() => {
				if(this.socket == null && this.intended_url != null &&
				this.socket_intention == SocketIntention.Connecting) {
					this.init_socket(this.intended_url)
				}
			}
			, 1000)
		);
	}
	onunload() {

	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async updateStatusBar(str:string){

		this.statusBar.setText(str);
	}

	async init_socket(url: string) {
		try{
			this.socket_intention = SocketIntention.Connecting
			this.socket = new WebSocket(url);
			this.socket.onopen = () => {
				console.log('Connected to the WebSocket server.');
				this.socket_intention = SocketIntention.Connected
			}
			
			this.socket.onmessage = event => {
				console.log('Received message:', event.data);
				console.log(event)
				// Display the received markdown content in the output div
				this.updateStatusBar(event.data)
			};
		  
			// Closed
			this.socket.onclose = () => {
				console.log('Disconnected from the WebSocket server.');
				this.socket = null
				this.socket_intention = SocketIntention.Resting
			};
		}
		catch {
			this.socket = null
		}

	}

}

export class InputUriModal extends Modal {
	constructor(app: App, onSubmit: (result: string) => void) {
		/**
		 * On submit: require a function that takes a string and returns nothing
		 */
		super(app);
		this.setTitle('Collab Url:');
		let url = '';
		new Setting(this.contentEl)
			.setName('Url:')
			.addText((text) =>
			text.onChange((value) => {
				url = value;
			}));
	
		var bar = new Setting(this.contentEl)
			.addButton((btn) =>
			btn
				.setButtonText('Submit')
				.setCta()
				.onClick(() => {
				onSubmit(url);
				this.close();
				}));
		
		bar.addButton((btn) =>
			btn
				.setButtonText('Close')
				.setCta()
				.onClick(() => {
				this.close();
				}));
	}
  }

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

const COLLAB_VIEW = 'collab-view'
class CollabView extends MarkdownView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return COLLAB_VIEW;
	}

	async onClose() {
		console.log("closing view")
		let collab_file = this.app.vault.getAbstractFileByPath("Collab_Connecting.md");
		console.log(collab_file);
		if (collab_file instanceof TFile) {
				this.app.vault.delete(collab_file);
		}
	}
}