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
				.setClass('submitButton')
				.setCta()
				.onClick(() => {
				onSubmit(url);
				this.close();
				}));
		
		bar.addButton((btn) =>
			btn
				.setButtonText('Cancel')
				.setCta()
				.onClick(() => {
				this.close();
				}));

		// Enter to submit
		this.scope.register([], 'Enter', (event: KeyboardEvent) => {
			if (event.isComposing) {
				return;
			}
			const actionBtn = document
				.getElementsByClassName('submitButton')
				.item(0) as HTMLButtonElement | null;
			actionBtn?.click();
		});
	}

	// onOpen() {
	// 	const { contentEl } = this;

	// 	const taskTitleLabel = contentEl.createEl('h6', { text: 'Test ' });
	// 	const taskTitleInput = wrapper.createEl('input', { type: 'text', placeholder: 'Enter task title' });
	// 	taskTitleInput.style.marginBottom = '10px';

	// 	const timeWrapper = wrapper.createEl('div', { cls: 'time-input-wrapper' });

	// 	const startTimeWrapper = timeWrapper.createEl('div', { cls: 'start-time-input-wrapper' });
	// 	const startTimeInputTitle = startTimeWrapper.createEl('h6', { text: 'Task Start Time :' });
	// 	const startTimeInput = startTimeWrapper.createEl('input', { type: 'time' });
	// }
  }