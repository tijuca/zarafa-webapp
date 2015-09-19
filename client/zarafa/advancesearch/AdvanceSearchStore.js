Ext.namespace('Zarafa.advancesearch');

/**
 * @class Zarafa.advancesearch.AdvanceSearchStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.advancesearchstore
 * 
 * The AdvabceSearchStore class provides a way to connect the 'advancedsearchlistmodule' in the server back-end to an 
 * Ext.grid.GridPanel object. It provides a means to retrieve search returl list asynchronously.
 * The advance search store object, once instantiated, will be able to retrieve and list search result from a
 * search folder only.
 */
Zarafa.advancesearch.AdvanceSearchStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor : function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass : 'IPM.Search'
		});

		Zarafa.advancesearch.AdvanceSearchStore.superclass.constructor.call(this, config);
	},
	
	/**
	 * Initialize all events which this {#Zarafa.advancesearch.AdvanceSearchStore AdvanceSearchStore} will listen to.
	 * @private
	 */
	initEvents : function()
	{
		this.on('load', this.onLoad, this);
	},
	
	/**
	 * Event handler for the load event of this {#Zarafa.advancesearch.AdvanceSearchStore}
	 * @param {Zarafa.advancesearch.AdvanceSearchStore} store This store
	 * @param {Zarafa.core.data.IPMRecord[]} records loaded record set
	 * @param {Object} options the options (parameters) with which the load was invoked.
	 * @private
	 */
	onLoad : function(store, records, options)
	{
		// Set the searchdate field for each record, so Ext can use it for local sorting
		Ext.each(records, function(record){
			var searchDate = '';
			switch (record.get('message_class')){
				case 'IPM.Note':
					searchDate = record.get('message_delivery_time') || record.get('last_modification_time');
					break;
				case 'IPM.Task':
					searchDate = record.get('duedate');
					break;
				case 'IPM.StickyNote':
					searchDate = record.get('creation_time');
					break;
				case 'IPM.Appointment':
					searchDate = record.get('commonstart');
					break;
				case 'IPM.Schedule':
				case 'IPM.Schedule.Meeting':
				case 'IPM.Schedule.Meeting.Request':
				case 'IPM.Schedule.Meeting.Canceled':
					searchDate = record.get('appointment_startdate');
			}

			// update the record in the store, bypass setting dirty flag,
			// and do not store the change in the modified records
			record.data['searchdate'] = searchDate;
			record.commit();
		});
	},

	/**
	 * Function will be used to issue a search request to server to start searching,
	 * this will internally call {@link #load} method but with some different options also it will
	 * cancel existing {@link Zarafa.core.Actions#updatesearch} or {@link Zarafa.core.Actions#search}
	 * request and send new {@link Zarafa.core.Actions#search} request with updated search restriction.
	 *
	 * @param {Object} options options object that must contain restriction to apply for search.
	 */
	search : function(options)
	{
		// When doing a new search we will have sorting done by the backend
		this.remoteSort = true;
		// Also remove the sortInfo because the backend will do sorting on relevance and not on a field
		delete this.sortInfo;
		
		if (this.isExecuting(Zarafa.core.Actions['updatesearch']) || this.isExecuting(Zarafa.core.Actions['search'])) {
			this.proxy.cancelRequests(Zarafa.core.Actions['updatesearch']);
			this.proxy.cancelRequests(Zarafa.core.Actions['search']);
		}

		this.hasSearch = false;

		Zarafa.advancesearch.AdvanceSearchStore.superclass.search.apply(this, arguments);
	}
});

Ext.reg('zarafa.advancesearchstore', Zarafa.advancesearch.AdvanceSearchStore);
