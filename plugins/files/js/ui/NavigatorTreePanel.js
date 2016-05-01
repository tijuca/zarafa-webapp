Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.NavigatorTreePanel
 * @extends Ext.tree.TreePanel
 * @xtype zarafa.filestreepanel
 * Shows tree of all user files from Files
 */
Zarafa.plugins.files.ui.NavigatorTreePanel = Ext.extend(Ext.tree.TreePanel, {

	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor : function(config) {
		config = config || {};
		Ext.applyIf(config, {
			xtype : 'zarafa.filestreepanel',
			enableDD : true,
			ddGroup : 'dd.filesrecord',
			root: {
				nodeType: 'async',
				text: '/',
				id: '/',
				expanded : true
			},
			autoScroll: true,
			listeners: {
				click: this.onNodeClick,
				beforenodedrop: {fn: function(e) {
				
					// e.data.selections is the array of selected records
					if(Ext.isArray(e.data.selections)) {
						// reset cancel flag
						e.cancel = false;
						
						Ext.each(e.data.selections, function(record) {
							record.setDisabled(true);
						});
						
						// we want Ext to complete the drop, thus return true
						return Zarafa.plugins.files.data.Actions.moveRecords(e.data.selections,e.target.id);
					}
					// if we get here the drop is automatically cancelled by Ext
				}},
				afterrender : function() {
					this.dragZone.lock(); // disable dragging from treepanel
				},
				expandnode : this.OnExpandNode,
				scope: this
			},
			viewConfig: {
				style : { overflow: 'auto', overflowX: 'hidden' }
			},
			maskDisabled: true,
			loader : new Zarafa.plugins.files.data.DirectoryLoader({loadfiles: false})
		});
		Zarafa.plugins.files.ui.NavigatorTreePanel.superclass.constructor.call(this, config);
	},
	
	/**
	 * eventhandler that handles the click on a node
	 * @param {Object} node
	 */
	onNodeClick : function(node) {
		Zarafa.plugins.files.data.ComponentBox.getStore().loadPath(node.attributes.id);
		var n = this.getNodeById(node.attributes.id);

		// Remove the icon class to show loading mask while user click on expandable node.
		if (node.isExpandable()) {
			var ui = node.getUI();
			var iconNode = Ext.get(ui.iconNode);
			iconNode.removeClass('icon_folder_note');
		}
		if(Ext.isDefined(n) && !n.isLeaf()) {
			n.reload();
		}
	},

	/**
	 * Event handler which is fires when a node is expanded in {@Link Zarafa.plugins.files.ui.NavigatorTreePanel}
	 * This will update the icon of root node as well as its all child's node
	 * @param {Ext.tree.TreeNode} rootNode The node which is expanded
	 */
	OnExpandNode: function (rootNode)
	{
		this.updateIcon(rootNode);
		if (rootNode.hasChildNodes()) {
			var childNodes = rootNode.childNodes;
			Ext.each(childNodes, function (node) {
				this.updateIcon(node);
			}, this)
		}
	},

	/**
	 * Function which is use to update the icon of {@Link Ext.tree.TreeNode}
	 * @param {Ext.tree.TreeNode} node The node which is need to update icon.
	 */
	updateIcon: function (node)
	{
		var ui = node.getUI();
		var iconNode = Ext.get(ui.iconNode);
		iconNode.addClass('icon_folder_note');
	}
});

Ext.reg('zarafa.filestreepanel',Zarafa.plugins.files.ui.NavigatorTreePanel); 
