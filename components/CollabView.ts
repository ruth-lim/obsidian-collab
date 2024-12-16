import {MarkdownView, WorkspaceLeaf, TFile} from 'obsidian'

export const COLLAB_VIEW = 'collab-view'
export class CollabView extends MarkdownView {
	title: string

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	init(title: string) {
		this.title = title;
	}
	
	getViewType() {
		return COLLAB_VIEW;
	}

	async onClose() {
		console.log("closing view")
		let collabFile = this.app.vault.getAbstractFileByPath(this.title);
		console.log(collabFile);
		if (collabFile instanceof TFile) {
				this.app.vault.delete(collabFile);
		}
	}
}