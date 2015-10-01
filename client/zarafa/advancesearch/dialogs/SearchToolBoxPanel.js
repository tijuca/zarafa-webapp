Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SearchToolBoxPanel
 * @extends Ext.Panel
 * @xtype zarafa.searchtoolboxpanel
 *
 */
Zarafa.advancesearch.dialogs.SearchToolBoxPanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Object} searchCriteria which contains the search criteria based on this 
	 * search criteria search restriction will be form.
	 * @private
	 */
	searchCriteria : {},

	/**
	 * @cfg {Object} messageClasses contains all message classes which used in advance search.
	 * @private
	 */
	messageClasses : {},

	/**
	 * @cfg {array} folder The {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} 
	 * on which search gets performed.
	 * @private
	 */
	folder : undefined,

	/**
	 * @cfg {array} searchFields The search fields which used to match with search string.
	 * @private
	 */
	searchFields : {},

	/**
	 * The {@link Zarafa.advancesearch.AdvanceSearchContextModel} which is obtained from
	 * the {@link #context}.
	 *
	 * @property
	 * @type Zarafa.advancesearch.AdvanceSearchContextModel
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		this.searchCriteria['date_range'] = {};
		this.searchCriteria['date_range']['start'] = 0; 
		this.searchCriteria['date_range']['end'] = 0; 

		var dateRangeStore = {
			xtype: 'jsonstore',
			autoDestroy: true,
			fields: ['name', 'value'],
			autoLoad: true,
			data: Zarafa.advancesearch.data.DateRangeFields
		};

		Ext.applyIf(config, {
			xtype : 'zarafa.searchtoolboxpanel',
			title: _('Search tools'),
			width: 175,
			boxMaxWidth : 175,
			boxMinWidth : 175,
			iconCls : 'advance_search',
			cls : 'zarafa-search-toolbox',
			split : true,
			plugins : [{
				ptype : 'zarafa.recordcomponentplugin'
			},{
				ptype : 'zarafa.recordcomponentupdaterplugin'
			}],
			collapsible: true,
			cmargins: '0 5 0 2',
			layout: 'fit',
			unstyled: true,
			ref : 'searchToolBox',
			items : [{
				xtype : 'container',
				layout : 'vbox',
				items : [
					this.createFoldersFieldset(config.model.getDefaultFolder()),
					this.createMessageTypeFieldset(),
					this.createDateRangeFieldset(dateRangeStore)
				]
			}]
		});

		this.addEvents(
			/**
			 * @event afterupdaterestriction fired after the {@link #searchCriteria} gets updated by the 
			 * {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel searchToolBox}.
			 * @param {Zarafa.advancesearch.dialogs.SearchToolBoxPanel} searchToolBox which used to triggers/update the search restriction.
			 */
			'afterupdaterestriction'
		);

		Zarafa.advancesearch.dialogs.SearchToolBoxPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the folders fieldset for search tool box of form panel.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} defaultFolder The default folder
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createFoldersFieldset : function(defaultFolder)
	{
		// Enable 'all folder' radio only if the default folder is personal folder, disable otherwise
		// in case if the default folder is either shared or public.
		var defaultStore = defaultFolder.getMAPIStore();
		var isPersonalFolder = !(defaultStore.isPublicStore() || defaultStore.isSharedStore());

		return {
			layout: 'form',
			margins: '5',
			xtype:'fieldset',
			border : false,
			width : 150,
			title: _('Folders'),
			items : [{
				xtype : 'radiogroup',
				columns : 1,
				ref : '../../folderRadioGroup',
				hideLabel : true,
				items : [{
					name : 'folders',
					checked : isPersonalFolder,
					disabled : !isPersonalFolder,
					inputValue : 'all_folders',
					ref : '../allFoldersRadio',
					boxLabel : _('All My folders'),
					listeners : {
						check : this.onRadioCheck,
						scope : this
					}
				},{
					name : 'folders',
					checked : !isPersonalFolder,
					ref : '../currentFolderRadio',
					inputValue : 'current_folder',
					boxLabel : _('Current folder') + ' ('+defaultFolder.getDisplayName()+')',
					listeners : {
						check : this.onRadioCheck,
						scope : this
					}
				}]
			}]
		};
	},

	/**
	 * Creates the message type fieldset for search tool box of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createMessageTypeFieldset : function()
	{
		return {
			layout: 'form',
			margins: '5',
			xtype:'fieldset',
			width : 150,
			border : false,
			title: _('Type'),
			items : [{
				xtype : 'checkboxgroup',
				ref : '../../messageTypeCheckboxGroup',
				columns : 1,
				hideLabel : true,
				defaults : {
					checked : true
				},
				items : [{
					name : 'mail',
					boxLabel : _('Mail'),
					listeners : {
						check : this.onFieldCheck,
						scope : this
					}
				},{
					name : 'calendar',
					boxLabel : _('Calendar'),
					listeners : {
						check : this.onFieldCheck,
						scope : this
					}
				},{
					name : 'contact',
					boxLabel : _('Contacts'),
					listeners : {
						check : this.onFieldCheck,
						scope : this
					}
				},{
					name : 'task',
					boxLabel : _('Tasks'),
					listeners : {
						check : this.onFieldCheck,
						scope : this
					}
				},{
					name : 'note',
					boxLabel : _('Notes'),
					listeners : {
						check : this.onFieldCheck,
						scope : this
					}
				}]
			}]
		};
	},

	/**
	 * Creates the date range fieldset for search tool box of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createDateRangeFieldset : function(dateRangeStore)
	{
		return {
			layout: 'form',
			margins: '5',
			xtype:'fieldset',
			width : 500,
			border : false,
			title: _('Date range'),
			items : [{
				xtype: 'compositefield',
				ref : '../../dateRangeCompositeField',
				hideLabel : true,
				items: [{
					xtype : 'radio',
					name : 'dateradio',
					ref : '../../../dateTypeRadio',
					hideLabel : true,
					checked : true
				},{
					xtype : 'combo',
					store : dateRangeStore,
					width : 100,
					ref : '../../../dateRangeCombo',
					minListWidth : 100,
					mode: 'local',
					hideLabel: true,
					triggerAction: 'all',
					displayField: 'name',
					valueField: 'value',
					lazyInit: false,
					forceSelection: true,
					editable: false,
					value : dateRangeStore.data[0].value,
					autoSelect : true,
					listeners : {
						select : this.onSelectCombo,
						scope : this
					}
				}]
			},{
				xtype : 'radio',
				name : 'dateradio',
				ref : '../../dateRangeRadio',
				hideLabel : true,
				boxLabel: _('Select a date range'),
				listeners: {
					check: this.onDateRadioCheck,
					scope: this
				}
			},{
				xtype: 'zarafa.dateperiodfield',
				ref: '../../dateField',
				width: 300,
				allowBlank : false,
				defaultValue : new Zarafa.core.DateRange({
					allowBlank : false ,
					startDate : new Date().add(Date.MONTH, -1),
					dueDate : new Date()
				}),
				startFieldConfig: {
					fieldLabel: _('From'),
					disabled : true,
					labelStyle : 'width : 35px',
					itemCls : 'zarafa-dateperiodfield-itemsCls',
					labelWidth: 50
				},
				endFieldConfig: {
					fieldLabel: _('To'),
					disabled : true,
					labelStyle : 'width : 35px',
					itemCls : 'zarafa-dateperiodfield-itemsCls',
					labelWidth: 50
				}
			}]
		};
	},

	/**
	 * Initialize events
	 * @private
	 */
	initEvents : function()
	{
		this.mon(this.folderRadioGroup, {
			render : this.onAfterRenderFolderRadioGroup,
			scope : this
		});

		this.mon(this.messageTypeCheckboxGroup, {
			render : this.onAfterRenderCheckboxGroup,
			scope : this
		});

		this.mon(this.dateRangeCombo, {
			enable : this.onEnableCombo,
			scope : this
		});

		this.mon(this.dateField,{
			change : this.onChangeDateField,
			scope : this
		});

		this.dateField.mon(this.dateField.startField, 'specialkey', this.onSpecialKey, this);
		this.dateField.mon(this.dateField.endField, 'specialkey', this.onSpecialKey, this);

		this.mon(this.model, 'folderchange', this.onFolderChange, this);
	},

	/**
	 * Event handler is fired for each special key, but it only handles the {@link Ext.EventObjectImp#ENTER} key.
	 * it was call the triggerBlur function of updated date field. which internally fire the 
	 * blur event and blur event fire the change event, which handled by 
	 * {@link Zarafa.common.ui.DatePeriodField#onStartChange} or {@link Zarafa.common.ui.DatePeriodField#onEndChange}
	 * which fire the {@link Zarafa.common.ui.DateRangeField#change} event of {@link Zarafa.common.ui.DateRangeField date rage field}
	 * and it was handled by the {@link #onChangeDateField}.
	 * 
	 * @param {Ext.form.Field} field The field which fired the event
	 * @param {Ext.EventObject} eventObj The event object for this event
	 */
	onSpecialKey : function(field, eventObj)
	{
		if (eventObj.getKey() == eventObj.ENTER) {
			field.triggerBlur();
		}
	},

	/**
	 * Event handler which is called when a selection has been made in the
	 * {@link Ext.form.ComboBox combobox}.
	 * @param {Ext.form.ComboBox} combo The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 * @private
	 */
	onSelectCombo : function(combo, record)
	{
		var value = record.get('value');
		var today = new Date();
		this.searchCriteria['date_range']['end'] = today.getTime() / 1000;

		switch(value) {
			case 'past_week' :
				this.searchCriteria['date_range']['start'] = today.add(Date.DAY, -7).getTime() / 1000;
			break;
			case 'past_two_weeks' :
				this.searchCriteria['date_range']['start'] = today.add(Date.DAY, -14).getTime() / 1000;
			break;
			case 'past_month' :
				this.searchCriteria['date_range']['start'] = today.add(Date.MONTH, -1).getTime() / 1000;
				break;
			case 'past_six_month' :
				this.searchCriteria['date_range']['start'] = today.add(Date.MONTH, -6).getTime() / 1000;
				break;
			case 'past_year' :
				this.searchCriteria['date_range']['start'] = today.add(Date.YEAR, -1).getTime() / 1000;
				break;
			default :
				this.searchCriteria['date_range']['start'] = 0; 
				this.searchCriteria['date_range']['end'] = 0; 
		}

		this.afterUpdateRestriction();
	},

	/**
	 * Event handler for the {@link Ext.form.RadioButton#check check} event, this will
	 * update the {@link #searchCriteria}, which used in advance search request.
	 *
	 * @param {Ext.form.RadioButton} field The radio button which was selected
	 * @param {Boolean} isChecked True if the radio button was checked
	 * @private
	 */
	onFieldCheck : function(field, isChecked)
	{
		if(isChecked) {
			this.messageClasses[field.name] = this.getMessageClass(field.name);
			this.searchFields[field.name] = Zarafa[field.name].data.SearchFields[0].value.split(' ');
		} else {
			delete this.messageClasses[field.name];
			delete this.searchFields[field.name];
		}

		this.createSearchCriteria(this.messageClasses, this.searchFields);

		this.afterUpdateRestriction();
	},

	/**
	 * Function call after the {@link #searchCriteria} gets updated
	 * by {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel search tool box}. this
	 * will fire the {@link #afterupdaterestriction} which triggers the advance search.
	 */
	afterUpdateRestriction : function()
	{
		this.fireEvent('afterupdaterestriction' , this);
	},

	/**
	 * Event handler was fire after the message type check box group gets rendered.
	 * @param {Ext.form.CheckboxGroup} group the group is {@link Ext.form.CheckboxGroup checkbox}
	 * @private
	 */
	onAfterRenderCheckboxGroup : function(group)
	{
		var checkBoxes = group.getValue();

		Ext.each(checkBoxes, function(checkBox) {
			this.messageClasses[checkBox.name] = this.getMessageClass(checkBox.name);
			this.searchFields[checkBox.name] = Zarafa[checkBox.name].data.SearchFields[0].value.split(' ');
		}, this);

		this.createSearchCriteria(this.messageClasses, this.searchFields);
	},

	/**
	 * Function is use to retive the message class based on the selected 
	 * {@link #createMessageTypeFieldset}.
	 * @param {String} checkBoxName The checkBoxName of the selected check box from check box list
	 * @return {Array} return and array of message classes.
	 */
	getMessageClass : function(checkBoxName)
	{
		switch(checkBoxName) {
			case 'mail':
				return ['IPM.Note'];
			case 'calendar':
				return ['IPM.Appointment', 'IPM.Schedule'];
			case 'contact':
				return ['IPM.Contact', 'IPM.DistList'];
			case 'task':
				return ['IPM.Task'];
			case 'note':
				return ['IPM.StickyNote'];
		}
	},

	/**
	 * Function is used to prepare the {@link #searchCriteria} for the message class and 
	 * search fields based on the selected message type checkbox Group.
	 * 
	 * @param {Array} messageClasses The array of supported message classes by webapp.
	 * @param {Array} searchFields The array on which search gets performs.
	 * @return {Object} return {@link #searchCriteria} on which search restriction forms
	 */
	createSearchCriteria : function(messageClasses, searchFields)
	{
		// Add the message class on which search gets performs.
		this.searchCriteria['message_class'] = {};

		var messageClass = [];
		Ext.iterate(messageClasses, function(key, value, Object) {
			messageClass.push(value);
		}, this);

		this.searchCriteria['message_class'] = Ext.flatten(messageClass);

		// Add the search fields on which search gets performs 
		this.searchCriteria['search_fields'] = {};

		var fields = [];
		Ext.iterate(searchFields, function(key, value, Object) {
			fields = fields.concat(value);
		}, this);

		var searchField = [];
		Ext.iterate(fields, function(key, value, Object) {
			if(searchField.indexOf(key) == -1) {
				searchField.push(key);
			}
		}, this);

		this.searchCriteria['search_fields'] = searchField;
	},

	/**
	 * Function is used to get the search criteria based on this search criteria 
	 * search restriction is generated.
	 * @return {Object} return {@link #searchCriteria} on which search restriction forms
	 */
	getSearchCriteria : function()
	{
		return this.searchCriteria;
	},

	/**
	 * Event handler was triggered when {@link Ext.form.Radio date range radio} checked or unchecked.
	 * it will enable or disable the date range combobox and start/end date filed.
	 *
	 * @param {Ext.Form.Radio} field The selected radio button.
	 * @param {Boolean} checked True when radio button is checked
	 */
	onDateRadioCheck : function(field, checked)
	{
		var startField = this.dateField.startField;
		var endField = this.dateField.endField;
		var dateRangeCombo = this.dateRangeCombo;

		if(checked) {
			startField.setDisabled(false);
			endField.setDisabled(false);

			this.searchCriteria['date_range']['start'] = startField.getValue().getTime() / 1000;
			this.searchCriteria['date_range']['end'] = endField.getValue().getTime() / 1000;

			dateRangeCombo.setDisabled(true);
			this.afterUpdateRestriction();
		} else {
			startField.setDisabled(true);
			endField.setDisabled(true);
			dateRangeCombo.setDisabled(false);
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.ui.DateRangeField} has been changed.
	 * This will update the start and due date inside the {@link #searchCriteria} accordingly.
	 *
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newRange The new date range
	 * @param {Mixed} oldRange The old date range
	 * @private
	 */
	onChangeDateField : function(field, newRange, oldRange)
	{
		var newStartDate = newRange.startDate.getTime()/1000;
		var newDueDate = newRange.dueDate.getTime()/1000;

		this.searchCriteria['date_range']['start'] = newStartDate;
		this.searchCriteria['date_range']['end'] = newDueDate;

		if(newRange.compare(oldRange) !== 0) {
			this.afterUpdateRestriction();
		}
	},

	/**
	 * Event handler triggers after the date range combo box gets enabled.
	 * also it will update the {@link #searchCriteria} based on the selected 
	 * value of the combo box.
	 * 
	 * @param {Ext.form.ComboBox} combo which gets enabled.
	 * @private
	 */
	onEnableCombo : function(combo)
	{
		var index = combo.getStore().find('value', combo.getValue());
		var record = combo.getStore().getAt(index);
		this.onSelectCombo(combo, record);
	},

	//-------------Folder radio Group------------------//
	/**
	 * Event handler triggers when parent context folder gets change.
	 * It updates the folder on which search is being performed.
	 * Enable/Disable 'all folders' radio button based on that particular folder if it is public/shared/personal.
	 * @param {Zarafa.core.ContextModel} model this context model.
	 * @param {Array} folders selected folders as an array of {Zarafa.hierarchy.data.MAPIFolderRecord Folder} objects.
	 * @private
	 */
	onFolderChange : function(model, folders)
	{
		var defaultStore = folders[0].getMAPIStore();
		var currentFolderRadio = this.folderRadioGroup.panel.currentFolderRadio;
		var allFoldersRadio = this.folderRadioGroup.panel.allFoldersRadio;
		
		// Change the label of the current folder radio button to show the name of the current folder
		currentFolderRadio.boxLabel = _('Current folder') + ' ('+model.getDefaultFolder().getDisplayName()+')';
		if(currentFolderRadio.rendered){
			currentFolderRadio.wrap.child('.x-form-cb-label').update(currentFolderRadio.boxLabel);
		}

		if( Ext.isDefined(defaultStore) && ( defaultStore.isSharedStore() || defaultStore.isPublicStore()) ) {
			allFoldersRadio.disable();

			// Need to prevent firing 'check' event of 'current folder' radio button to
			// avoid making search request as it is not needed in this particular situation
			currentFolderRadio.suspendEvents();
			currentFolderRadio.setValue(true);
			currentFolderRadio.resumeEvents();
		} else {
			allFoldersRadio.enable();
		}

		var selectedRadio = this.folderRadioGroup.getValue();
		if(selectedRadio.inputValue == 'current_folder') {
			this.setFolder(selectedRadio);
		}
	},

	/**
	 * Event handler triggers on folders field set gets rendered.
	 * here by default All My Folder radio button is selected so
	 * it will select {@link Zarafa.common.data.FolderContentTypes.ipmsubtree IPM_SUBTREE}
	 * as default folder on which search gets perform.
	 * @param {Ext.form.RadioGroup} radioGroup The radio group which fired the event
	 */
	onAfterRenderFolderRadioGroup : function(radioGroup)
	{
		var selectedRedio = radioGroup.getValue();
		this.setFolder(selectedRedio);
	},

	/**
	 * Function is used to set the folder on which search performed.
	 * here All My folders indicates {@link Zarafa.common.data.FolderContentTypes.ipmsubtree IPM_SUBTREE}
	 * and Current folder which user currently has selected.
	 * 
	 * @param {Ext.Form.Radio} radio The selected radio button.
	 */
	setFolder : function(radio)
	{
		var defaultFolder = this.model.getDefaultFolder();
		if(radio.inputValue === 'all_folders') {
			this.folder = defaultFolder.getMAPIStore().getSubtreeFolder();
		} else if(radio.inputValue === 'current_folder'){
			this.folder = defaultFolder;
		}
	},

	/**
	 * Function is used to get the selected folder on which search perform.
	 * 
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} The selected folder
	 */
	getFolder : function()
	{
		return this.folder;
	},

	/**
	 * Event handler is triggered when {@link Ext.form.Radio radio} button 
	 * gets select.
	 * 
	 * @param {Ext.Form.Radio} radio The selected radio button.
	 * @param {Boolean} checked True when radio button is checked
	 */
	onRadioCheck : function(radio, checked)
	{
		if(checked) {
			this.setFolder(radio);
			this.afterUpdateRestriction();
		}
	},

	/**
	 * Function will be used to create search restriction based on value entered in
	 * search textfield and {@link Zarafa.common.search.dialogs.SearchToolBoxPanel SearchToolBox}.
	 *  
	 * In words: all terms must occur at least once, but it doesn't matter in which of the fields they occur.
	 *
	 * @param {String} textFieldValue value of search text field.
	 * @return {Object} Object that will be passed as restriction to server.
	 * @private
	 */
	createRestriction : function(textFieldValue)
	{
		var searchCriteria = this.getSearchCriteria();

		if (Ext.isEmpty(textFieldValue)) {
			return [];
		}

		var finalRes = [];
		var andRes = [];
		var andResDate = [];
		var orResSearchField = [];
		var orResMessageClass = [];

		Ext.iterate(searchCriteria, function(key, values, Object) {
			// search field restriction
			if(key === 'search_fields') {
				Ext.each(values, function(value, index, values){
					orResSearchField.push(
						Zarafa.core.data.RestrictionFactory.dataResContent(
							value,
							Zarafa.core.mapi.Restrictions.FL_SUBSTRING | Zarafa.core.mapi.Restrictions.FL_IGNORECASE,
							textFieldValue
						)
					);
				}, this);
			}

			// Date Range restriction 
			if(key === 'date_range') {
				if(values.start !== 0 && values.end !== 0) {
					andResDate.push(
						Zarafa.core.data.RestrictionFactory.dataResProperty(
							'last_modification_time',
							Zarafa.core.mapi.Restrictions.RELOP_GE,
							values.start
						)
					);
					andResDate.push(
						Zarafa.core.data.RestrictionFactory.dataResProperty(
							'last_modification_time',
							Zarafa.core.mapi.Restrictions.RELOP_LT,
							values.end
						)
					);
				}
			}
			// message class restriction 
			if(key === 'message_class' && !Ext.isEmpty(values)) {
				Ext.each(values, function(value, index, values){
					orResMessageClass.push(
						Zarafa.core.data.RestrictionFactory.dataResContent(
							key,
							Zarafa.core.mapi.Restrictions.FL_PREFIX | Zarafa.core.mapi.Restrictions.FL_IGNORECASE,
							value
						)
					);
				}, this);
			}
		}, this);

		/**
		 * It date informations are present in search criteria then create search restriction
		 * something like this.
		 * AND
		 * 		AND
		 * 			AND
		 * 				start date 
		 * 				end date
		 * 			OR
		 * 				searchFields
		 * 		OR
		 * 			message class
		 */
		if(!Ext.isEmpty(andResDate)) {
			var andResDateSearchField = [];
			andResDateSearchField.push(Zarafa.core.data.RestrictionFactory.createResAnd(andResDate));
			andResDateSearchField.push(Zarafa.core.data.RestrictionFactory.createResOr(orResSearchField));
			andRes.push(Zarafa.core.data.RestrictionFactory.createResAnd(andResDateSearchField));
		} else {
			/**
			 * If date information is not present in search criteria then create search restriction
			 * something like this.
			 * AND
			 * 		OR
			 * 			searchFields
			 * 		OR
			 * 			message class
			 */
			andRes.push(Zarafa.core.data.RestrictionFactory.createResOr(orResSearchField));
		}

		// Message class restriction which indicates which type of message you want to search.
		andRes.push(Zarafa.core.data.RestrictionFactory.createResOr(orResMessageClass));
		if(!Ext.isEmpty(andRes)) {
			finalRes = Zarafa.core.data.RestrictionFactory.createResAnd(andRes);
		}

		return finalRes;
	}
});

Ext.reg('zarafa.searchtoolboxpanel', Zarafa.advancesearch.dialogs.SearchToolBoxPanel);

