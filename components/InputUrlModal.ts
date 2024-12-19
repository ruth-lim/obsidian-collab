import { App, Modal, Setting } from 'obsidian';
import { io, Socket} from "socket.io-client";

export class InputUrlModal extends Modal {
	socket: Socket | null;
	unableToConnectElement: HTMLElement | null;
	loadingElement: HTMLElement;
	constructor(app: App, onSubmit: (result: Socket) => void) {
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
							console.log(`MODAL: ${this.socket.id}`);
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
			let socketPromise = new Promise<Socket | null>(function(resolve, reject) {
				var server = io(url);
				server.on("connect", function() {
					console.log('Connected to the WebSocket server.');
					resolve(server);
				});
				setTimeout(() => reject("Connection timed out."), 10000);
			});
			let socket = await socketPromise;
			return socket;
		}
		catch {
			this.socket?.close();
			return null;
		}

	}
  }