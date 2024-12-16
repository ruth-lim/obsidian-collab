import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { CollabView, COLLAB_VIEW } from 'components/CollabView';
import { InputUrlModal } from 'components/InputUrlModal';
import { CollabInstance } from 'components/CollabInstance';


interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	statusBar: HTMLElement;

	async onload() {
		await this.loadSettings();
		// idk whats this lol its j some status bar text below
		this.statusBar = this.addStatusBarItem();

		// Register this view to obisdian
		this.registerView(
			COLLAB_VIEW,
			(leaf) => new CollabView(leaf)
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('cable', 'Collab', (evt: MouseEvent) => { // Called when the user clicks the icon.
			new Notice('Work In Progress!');
			new InputUrlModal(this.app, (urlString) => this.handleEntryPoint(urlString)).open();
		});
	}

	async handleEntryPoint(urlString: string) {
		let collab = new CollabInstance(this, urlString);
		collab.open();
	}


	onunload() {
		let collabLeaves = this.app.workspace.getLeavesOfType(COLLAB_VIEW);
		for (let i = 0; i < collabLeaves.length; i++) {
			collabLeaves[i].detach()
		}
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

