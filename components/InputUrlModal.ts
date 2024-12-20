import { App, Modal, Setting } from 'obsidian';
import { io, Socket} from "socket.io-client";

export class InputUrlModal extends Modal {
	unableToConnectElement: HTMLElement | null;
	loadingElement: HTMLElement;
	abortController: AbortController;
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
					this.establishConnection(url).then( (socket) => {
						console.log("Finished Establishing connection");
						if (socket) {
							console.log(`MODAL: ${socket.id}`);
							this.close();
							onSubmit(socket);
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

		let socket = await this.initSocket(url);
		if (socket) {
			this.contentEl.empty();
			return socket;
		} else {
			this.unableToConnectElement = this.contentEl.createEl('p', { text: `Unable to connect to ${url}`, cls: 'unableToConnect' });
			this.unableToConnectElement.show();
			this.loadingElement.hide();
		}
	}

	async initSocket(url: string) {
		let server: Socket| null = io(url);
		try {
			let socketPromise = new Promise<Socket | null>(
				function(resolve, reject) {
					
					let timeOut = setTimeout(
						() => {
							server?.close();
							server?.off();
							console.log(`Closing server: ${server}`);
							server = null;
							console.log("Connection timed out.");
							resolve(null);
						}, 10000
					);
					server?.on("connect", function() {
						console.log('Connected to the WebSocket server.');
						clearTimeout(timeOut);
						resolve(server);
					});
					
				});
			let socket = await socketPromise;
			return socket;
		}
		catch {
			server?.close();
			return null;
		}

	}
  }