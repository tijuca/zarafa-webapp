Ext.namespace('Zarafa.common.search.dialogs');

/**
 * @class Zarafa.common.search.dialogs.SearchToolBoxPanel
 * @extends Ext.Panel
 * @xtype zarafa.searchtoolboxpanel
 *
 */
Zarafa.common.search.dialogs.SearchToolBoxPanel = Ext.extend(Ext.Panel, {

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
	 * @cfg {array} mail contains all supported message classes by mail messages.
	 * It will used in preparing the search restriction.
	 * @private
	 */
	mail : undefined,

	/**
	 * @cfg {array} calendar contains all supported message classes by calendar messages.
	 * It will used in preparing the search restriction.
	 * @private
	 */
	calendar : undefined,

	/**
	 * @cfg {array} task contains all supported message classes by task messages.
	 * It will used in preparing the search restriction.
	 * @private
	 */
	task : undefined,

	/**
	 * @cfg {array} note contains all supported message classes by note messages.
	 * It will used in preparing the search restriction.
	 * @private
	 */
	note : undefined,

	/**
	 * @cfg {array} contact contains all supported message classes by contact messages.
	 * It will used in preparing the search restriction.
	 * @private
	 */
	contact : undefined,

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
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		if (!Ext.isDefined(config.mail)) {
			config.mail = ['IPM.Note'];
		}

		if (!Ext.isDefined(config.calendar)) {
			config.calendar = ['IPM.Appointment', 'IPM.Schedule'];
		}

		if (!Ext.isDefined(config.contact)) {
			config.contact = ['IPM.Contact', 'IPM.DistList'];
		}

		if (!Ext.isDefined(config.task)) {
			config.task = ['IPM.Task'];
		}

		if (!Ext.isDefined(config.note)) {
			config.note = ['IPM.StickyNote'];
		}

		this.parentComponent = config.scope;

		var dateRangeStore = {
			xtype: 'jsonstore',
			autoDestroy: true,
			fields: ['name', 'value'],
			autoLoad: true,
			data: Zarafa.common.search.data.DateRangeFields
		};

		Ext.applyIf(config, {
			xtype : 'zarafa.searchtoolboxpanel',
			title: _('Search tools'),
			width: 170,
			boxMaxWidth : 200,
			iconCls : 'advance_search',
			style : 'background-color: #F4F4F4;', // create proper css class
			split : true,
			plugins : [{
				ptype : 'zarafa.recordcomponentplugin'
			},{
				ptype : 'zarafa.recordcomponentupdaterplugin'
			}],
			collapsible: true,
			collapsed : true,
			cmargins: '0 5 0 2',
			layout: 'fit',
			floatable : false,
			unstyled: true,
			ref : 'searchToolBox',
			items : [{
				xtype : 'container',
				layout : 'vbox',
				items : [
					this.createFoldersFieldset(),
					this.createMessageTypeFieldset(),
					this.createDateRangeFieldset(dateRangeStore)
				]
			}]
		});

		this.addEvents(
			/**
			 * @event afterrenderallchildcomponent fired after the all child components
			 * get rendered.
			 * @param {Zarafa.common.search.dialogs.SearchToolBoxPanel} searchToolBox which used to triggers/update the search restriction.
			 */
			'afterrenderallchildcomponent',

			/**
			 * @event afterupdaterestriction fired after the {@link #searchCriteria} gets updated by the 
			 * {@link Zarafa.common.search.dialogs.SearchToolBoxPanel searchToolBox}.
			 * @param {Zarafa.common.search.dialogs.SearchToolBoxPanel} searchToolBox which used to triggers/update the search restriction.
			 */
			'afterupdaterestriction'
		);

		Zarafa.common.search.dialogs.SearchToolBoxPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the folders fieldset for search tool box of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createFoldersFieldset : function()
	{
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
					checked : true,
					inputValue : 'all_folders',
					boxLabel : _('All My folders'),
					listeners : {
						check : this.onRadioCheck,
						scope : this
					}
				},{
					name : 'folders',
					inputValue : 'current_folder',
					boxLabel : _('Current folder'),
					listeners : {
						check : this.onRadioCheck,
						scope : this
					}
				}]
			}]
		}
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
		}
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
			ref : '../dateRandeFieldset',
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
				allowBlank : true,
				width: 300,
				listeners: {
					render: function(field){
						var fromDate = new Date().add(Date.MONTH, -1).clearTime();
						field.startField.setValue(fromDate);
						field.endField.setValue(new Date().clearTime());
					},
					scope: this
				},
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
		}
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

		this.mon(this.dateRangeCompositeField ,{
			afterrender : this.onAfterRenderCompositeField,
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
	},

	/**
	 * function called after the component has been rendered (right before the 'afterrender' event has fired)
	 * it will update the {@link #searchCriteria}, which used in advance search request.
	 * @private
	 */
	onAfterRenderCompositeField : function(compositeField)
	{
		this.searchCriteria['date_range'] = {};
		this.searchCriteria['date_range']['start'] = 0; 
		this.searchCriteria['date_range']['end'] = 0; 

		// it shows that all child component was renderd properly.
		this.fireEvent('afterrenderallchildcomponent', this);
	},

	/**
	 * Event handler which is called when a selection has been made in the
	 * {@link Ext.form.ComboBox combobox}.
	 * @param {Ext.form.ComboBox} field The field which fired the event
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
			case 'past2_weeks' :
				this.searchCriteria['date_range']['start'] = today.add(Date.DAY, -14).getTime() / 1000;
			break;
			case 'past_month' :
				this.searchCriteria['date_range']['start'] = today.add(Date.MONTH, -1).getTime() / 1000;
				break;
			case 'past6_month' :
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
	 * @param {Ext.form.RadioButton} rb The radio button which was selected
	 * @param {Boolean} isChecked True if the radio button was checked
	 * @private
	 */
	onFieldCheck : function(field, isChecked)
	{
		if(isChecked) {
			this.messageClasses[field.name] = this[field.name];
			this.searchFields[field.name] = Zarafa[field.name].data.SearchFields[0].value.split(' ');
		} else {
			delete this.messageClasses[field.name];
			delete this.searchFields[field.name];
		}

		this.searchCriteria = this.createSearchCriteria(this.messageClasses, this.searchFields);

		this.afterUpdateRestriction();
	},

	/**
	 * Function call after the {@link #searchCriteria} gets updated
	 * by {@link Zarafa.common.search.dialogs.SearchToolBoxPanel search tool box}. this
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
			this.messageClasses[checkBox.name] = this[checkBox.name];
			this.searchFields[checkBox.name] = Zarafa[checkBox.name].data.SearchFields[0].value.split(' ');
		}, this);

		this.searchCriteria = this.createSearchCriteria(this.messageClasses, this.searchFields);
	},

	/**
	 * Function is used to prepare the {@link #searchCriteria} for the message class and 
	 * search fields based on the selected message type checkbox Group.
	 *
	 * @return {Object} return {@link #searchCriteria} on which search restriction forms
	 */
	createSearchCriteria : function(messageClasses, searchFields)
	{
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
			fields.push(value)
		}, this);

		fields = Ext.flatten(fields);

		var searchField = [];
		Ext.iterate(fields, function(key, value, Object) {
			if(searchField.indexOf(key) == -1) {
				searchField.push(key);
			}
		}, this);

		this.searchCriteria['search_fields'] = Ext.flatten(searchField);

		return this.searchCriteria;
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
	 * @param {Boolean} checkState True when radio button is checked
	 */
	onDateRadioCheck : function(field, checkState)
	{
		var startField = this.dateField.startField;
		var endField = this.dateField.endField;
		var dateRangeCombo = this.dateRangeCombo;

		if(checkState) {
			startField.setDisabled(false);
			endField.setDisabled(false);

			this.searchCriteria['date_range']['start'] = startField.getValue().clearTime().getTime() / 1000;
			this.searchCriteria['date_range']['end'] = endField.getValue().clearTime().getTime() / 1000;

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
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The original value for the field
	 * @private
	 */
	onChangeDateField : function(field, newRange, oldRange)
	{
		this.searchCriteria['date_range']['start'] = newRange.startDate.clearTime().getTime()/1000;
		this.searchCriteria['date_range']['end'] = newRange.dueDate.clearTime().getTime()/1000;
		this.afterUpdateRestriction();
	},

	/**
	 * Event handler triggers after the date range combo box gets enabled.
	 * also it will update the {@link #searchCriteria} based on the selected 
	 * value of the combo box.
	 * 
	 * @param {Ext.form.ComboBox} comboBox which gets enabled.
	 * @private
	 */
	onEnableCombo : function(combo)
	{
		var index = combo.getStore().find('value', combo.getValue());
		var record = combo.getStore().getAt(index);
		this.onSelectCombo(combo, record);
	},

	/**
	 * Event handler triggers on folders field set gets rendered.
	 * here by default All My Folder radio button is selected so
	 * it will select {@link Zarafa.common.data.FolderContentTypes.ipmsubtree IPM_SUBTREE}
	 * as default folder on which search gets perform.
	 * @param {Ext.form.RadioGroup} group The radio group which fired the event
	 */
	onAfterRenderFolderRadioGroup : function(radioGroup)
	{
		var selectedRedio = radioGroup.getValue();
		this.setFolder(selectedRedio)
	},

	/**
	 * Function is used to set the folder on which search performed.
	 * here All My folders indicates {@link Zarafa.common.data.FolderContentTypes.ipmsubtree IPM_SUBTREE}
	 * and Current folder which user currently has selected.
	 * 
	 * @param {Ext.Form.Radio} field The selected radio button.
	 */
	setFolder : function(radio)
	{
		var defaultFolder = this.model.getDefaultFolder();
		if(radio.inputValue === 'all_folders') {
			this.folder = defaultFolder.getParentFolder();
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
	 * @param {Ext.Form.Radio} field The selected radio button.
	 * @param {Boolean} checkState True when radio button is checked
	 */
	onRadioCheck : function(radio, checked)
	{
		if(checked) {
			this.setFolder(radio);
			this.afterUpdateRestriction();
		}
	},

	/**
	 * TODO : Advance Search change comments 
	 * Function will be used to create search restriction based on value entered in
	 * search textfield and {@link Zarafa.common.search.dialogs.SearchToolBoxPanel SearchToolBox}.
	 * The textFieldValue and comboboxValue are
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

		if (Ext.isEmpty(textFieldValue) || Ext.isEmpty(searchCriteria['message_class'])) {
			return [];
		}

		var finalRes = [];
		var andRes = [];
		var terms = textFieldValue;
		var andResDate = [];
		var orResSearchField = [];
		var orResMessageClass = [];

		var testSubject = [];

		Ext.iterate(searchCriteria, function(key, values, Object) {
			// search field restriction
			if(key === 'search_fields') {
				Ext.each(values, function(value, index, values){
					orResSearchField.push(
						Zarafa.core.data.RestrictionFactory.dataResContent(
							value,
							Zarafa.core.mapi.Restrictions.FL_SUBSTRING | Zarafa.core.mapi.Restrictions.FL_IGNORECASE,
							terms
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

Ext.reg('zarafa.searchtoolboxpanel', Zarafa.common.search.dialogs.SearchToolBoxPanel);

