import {MarkdownView, WorkspaceLeaf, TFile} from 'obsidian';
import { Socket } from "socket.io-client";
import {ChangeSet, Text, EditorState, StateEffect} from "@codemirror/state";
import {Update, rebaseUpdates} from "@codemirror/collab";
import { EditorView } from "@codemirror/view";
import { peerExtension } from './CodeMirrorCollab';

export const COLLAB_VIEW = 'collab-view'
export class CollabView extends MarkdownView {
	title: string;
	socket: Socket| null;// NULL is here because of the whacky implementation of the LoadingView.

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}
	

	async init(title: string, socket:Socket | null) {
		this.title = title;
		this.socket = socket;
		// @ts-expect-error, not typed
		console.log(this.editor.cm);
		if (socket) {
			// @ts-expect-error, not typed
			this.editor.cm.dispatch({
				effects: StateEffect.appendConfig.of(peerExtension(0, socket))
			});
		}
		console.log("Plugin dispatched");
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
		if (this.socket && this.socket?.connected) {
			console.log('Websocket closed');
			this.socket.close();
			this.socket.off();
		}
	}
}