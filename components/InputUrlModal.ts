import {App, Modal, Setting} from 'obsidian'

export class InputUrlModal extends Modal {
	socket: WebSocket | null;
	unableToConnectElement: HTMLElement | null;
	loadingElement: HTMLElement;
	constructor(app: App, onSubmit: (result: WebSocket) => void) {
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
					this.establishConnection(url).then( () => {
						console.log("Finished Establishing connection");
						if (this.socket) {
							onSubmit(this.socket);
						}
					});
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

	async establishConnection(url : string) {
		if (this.loadingElement) {
			this.loadingElement.show();
		} else {
			this.loadingElement = this.contentEl.createEl('p', { text: 'Loading', cls: 'loadingElement' });
		}
		
		if (this.unableToConnectElement) {
			this.unableToConnectElement.hide();
		}

		this.socket = await this.initSocket(url);
		if (this.socket) {
			this.contentEl.empty();
			this.close();
		} else {
			this.unableToConnectElement = this.contentEl.createEl('p', { text: `Unable to connect to ${url}`, cls: 'unableToConnect' });
			this.unableToConnectElement.show();
			this.loadingElement.hide();
		}
	}


	async initSocket(url: string) {
		try {
			let socketPromise = new Promise<WebSocket | null>(function(resolve, reject) {
				var server = new WebSocket(url);
				server.onopen = function() {
					console.log('Connected to the WebSocket server.');
					resolve(server);
				};
				server.onerror = function(err) {
					console.log('Disconnected from the WebSocket server.');
					reject(err);
				};
		
			});
			let socket = await socketPromise;
			return socket;
		}
		catch { 
			return null;
		}

	}
  }