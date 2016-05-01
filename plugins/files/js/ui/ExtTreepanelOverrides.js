Ext.tree.TreeNodeUI.prototype.updateExpandIcon = Ext.tree.TreeNodeUI.prototype.updateExpandIcon.createSequence(function() {    
	/* This is called after the Ext.tree.TreeNodeUI.updateExpandIcon method has finished and adds  
		the following process to that method. 
		If we have flagged that this node is to remain a folder whether or not is has children, 
		and it has just been made into a leaf (as indicated by wasLeaf now being true), 
		then reverse what the updateExpandIcon method just did and turn it back into a closed (collapsed) folder. 
	*/ 
	
	if (this.node.attributes.isFolder && this.wasLeaf) { 
		this.removeClass("x-tree-node-leaf"); 
		this.addClass("x-tree-node-collapsed"); 
		this.c1 = "x-tree-node-expanded"; 
		this.c2 = "x-tree-node-collapsed"; 
		this.wasLeaf = false;     
	} 
});


Ext.tree.TreeNodeUI.prototype.ecClick = Ext.tree.TreeNodeUI.prototype.ecClick.createSequence(function (e) {
	/*  This is called after the Ext.tree.TreeNodeUI.ecClick method has finished and remove the
	 	icon class to show loading mask while user click on expand button.
	 */
	var node = this.node;
	if(node.ownerTree instanceof Zarafa.plugins.files.ui.NavigatorTreePanel){
		if(!node.isLoaded()) {
			var iconNode = Ext.get(this.iconNode);
			iconNode.removeClass('icon_folder_note');
		}
	}
});