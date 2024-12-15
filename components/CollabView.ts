import {MarkdownView, WorkspaceLeaf, TFile} from 'obsidian'
export const COLLAB_VIEW = 'collab-view'
export class CollabView extends MarkdownView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return COLLAB_VIEW;
	}

	async onClose() {
		console.log("closing view")
		let collab_file = this.app.vault.getAbstractFileByPath("Collab_Connecting.md");
		console.log(collab_file);
		if (collab_file instanceof TFile) {
				this.app.vault.delete(collab_file);
		}
	}
}