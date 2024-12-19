import {MarkdownView, WorkspaceLeaf, TFile} from 'obsidian'
import { Socket } from "socket.io-client";

export const COLLAB_VIEW = 'collab-view'
export class CollabView extends MarkdownView {
	title: string;
	socket: Socket| null;// NULL is here because of the whacky implementation of the LoadingView.

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	init(title: string, socket:Socket | null) {
		this.title = title;
		this.socket = socket;
	}

	
	getViewType() {
		return COLLAB_VIEW;
	}

	async onClose() {
		console.log(`closing view, socket: ${this.socket}`);
		let collabFile = this.app.vault.getAbstractFileByPath(this.title);
		console.log(collabFile);
		if (collabFile instanceof TFile) {
			this.app.vault.delete(collabFile);
		}
		if (this.socket) {
			console.log('Websocket closed');
			this.socket.close();
		}
	}
}