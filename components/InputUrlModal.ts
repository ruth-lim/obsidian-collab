import {App, Modal, Setting} from 'obsidian'

export class InputUrlModal extends Modal {
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