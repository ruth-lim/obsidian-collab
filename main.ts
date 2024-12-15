import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { CollabView, COLLAB_VIEW } from 'components/CollabView';
import { InputUrlModal } from 'components/InputUrlModal';
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
			new InputUrlModal(this.app, (str) => this.handleEntryPoint(this, str)).open();
		});
		// test 'ws://localhost:8080'
		this.registerInterval(
		window.setInterval(
			() => {
				if(this.socket == null && this.intended_url &&
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

	async handleEntryPoint(plugin: MyPlugin, str: string) {
		new Notice(`You attempted to connect to ${str}!`)
		try {
			plugin.init_socket(str);
		}
		catch (e) {
			console.log(e)
		}
		
		plugin.intended_url = str;
		plugin.app.vault.create("Collab_Connecting.md", "Loading...").then(
			tmp_file => {
				let leaf = plugin.app.workspace.getLeaf('tab');
				let _view = new CollabView(leaf);
				leaf.open(_view);
				let file = plugin.app.vault.getFileByPath("Collab_Connecting.md");
				if(file) {
					leaf.openFile(file);
				}
			}
		)			
	}
	
	async init_socket(url: string) {
		try{
			this.socket_intention = SocketIntention.Connecting
			this.socket = new WebSocket(url);
			this.socket.onopen = () => {
				console.log('Connected to the WebSocket server.');
				this.socket_intention = SocketIntention.Connected;
			}
			
			this.socket.onmessage = event => {
				console.log('Received message:', event.data);
				console.log(event);
				// Display the received markdown content in the output div
				this.updateStatusBar(event.data);
			};
		  
			// Closed
			this.socket.onclose = () => {
				console.log('Disconnected from the WebSocket server.');
				this.socket = null;
				this.socket_intention = SocketIntention.Resting;
			};
		}
		catch {
			this.socket = null;
		}

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

