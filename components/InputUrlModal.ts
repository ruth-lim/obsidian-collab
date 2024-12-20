import { App, Modal, Setting } from 'obsidian';
import { abort } from 'process';
import { io, Socket} from "socket.io-client";

export class InputUrlModal extends Modal {
	unableToConnectElement: HTMLElement | null;
	socket: Socket | null;
	abortController: AbortController | null;
	loadingElement: HTMLElement;
	constructor(app: App, onSubmit: (result: Socket) => void) {
		/**
		 * On submit: require a function that takes a string and returns nothing
		 */
		super(app);
		this.setTitle('Collab Url:');
		let url = '';
		this.socket = null;
		this.abortController = null;
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
		// If trying to connect previously, abort it.
		this.abortController?.abort();
		this.socket?.close();
		this.socket?.off();

		// Establish new connection
		this.abortController = new AbortController();
		const {signal} = this.abortController;
		this.showLoading();
		try {
			this.socket = await this.initSocket(url, signal);
			this.contentEl.empty();
			return this.socket;
		} catch (error) {
			if (error.message === 'AbortError') { 
				/** 
				 * If this error is received, it means the user tried to connect again.
				 * In this case, we don't show the error message and let the user silently retry.
				 */  
				console.log(`Connection to ${url} aborted`);
			} else {
				this.showError(url); 
				return null;
			}
			
		}
	}

	async initSocket(url: string, signal: AbortSignal) {
		let server = io(url);
		try {
			let socketPromise = new Promise<Socket>(
				(resolve, reject) => {
					let timeOut = setTimeout(
						() => {
							console.log(`Connection to ${server} timed out.`);
							reject(new Error('TimeoutError'));
						}, 10000
					);
					signal.addEventListener('abort', () => {
						console.log('Aborting')
						clearTimeout(timeOut);
						reject(new Error('AbortError'));
					});
					server.on("connect", function() {
						console.log('Connected to the WebSocket server.');
						clearTimeout(timeOut);
						resolve(server);
					});
				});
			let socket = await socketPromise;
			return socket;
		} catch (error) {
			server.close();
			server.off();
			console.log(error);
			if (error.message === 'AbortError') {
				console.log('Yes error is AbortError');
			}
			throw error; 
		}

	}

	async showLoading() {
		if (this.loadingElement) {
			this.loadingElement.show();
		} else{
			this.loadingElement = this.contentEl.createEl('p', { text: 'Loading', cls: 'loadingElement' });
		} 
		this.unableToConnectElement?.hide();
	}

	async showError(url: string, error?:  string){
		if (error) {
			console.log(error);
		}
		if (this.unableToConnectElement) {
			this.contentEl.getElementsByClassName('unableToConnect')[0].setText(`Unable to connect to ${url}`);
		} else {
			this.unableToConnectElement = this.contentEl.createEl('p', { text: `Unable to connect to ${url}`, cls: 'unableToConnect' });
		}	
		this.unableToConnectElement.show();
		this.loadingElement.hide();
	}
  }