<?php
	class AdvancedSearchListModule extends ListModule
	{
		/**
		 * Constructor
		 * @param		int		$id			unique id.
		 * @param		array		$data		list of all actions.
		 */
		function AdvancedSearchListModule($id, $data)
		{
			// TODO: create a new method in Properties class that will return only the properties we
			// need for search list (and perhaps for preview???)
			$this->properties = $GLOBALS["properties"]->getMailListProperties();
			$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getAppointmentListProperties());
			$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getContactListProperties());
			$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getStickyNoteListProperties());
			$this->properties = array_merge($this->properties, $GLOBALS["properties"]->getTaskListProperties());
			$this->properties = array_merge($this->properties, array('body' => PR_BODY, 'html_body' => PR_HTML, 'appointment_startdate' => "PT_SYSTIME:PSETID_Appointment:0x820d", "creation_time" => PR_CREATION_TIME, "duedate" => "PT_SYSTIME:PSETID_Task:0x8105"));
			$this->properties = getPropIdsFromStrings($GLOBALS["mapisession"]->getDefaultMessageStore(), $this->properties);

			parent::ListModule($id, $data);
		}

		/**
		 * Executes all the actions in the $data variable.
		 * @return		boolean					true on success or false on failure.
		 */
		function execute()
		{
			foreach($this->data as $actionType => $action)
			{
				if(isset($actionType)) {
					try {
						$store = $this->getActionStore($action);
						$parententryid = $this->getActionParentEntryID($action);
						$entryid = $this->getActionEntryID($action);

						switch($actionType)
						{
							case "list":
							case "updatelist":
								$this->getDelegateFolderInfo($store);
								$this->messageList($store, $entryid, $action, $actionType);
								break;
							case "search":
								$this->search($store, $entryid, $action, $actionType);
								break;
							case "updatesearch":
								$this->updatesearch($store, $entryid, $action);
								break;
							case "stopsearch":
								$this->stopSearch($store, $entryid, $action);
								break;
							case "delete":
								$this->delete($store, $parententryid, $entryid, $action);
								break;
							case "delete_searchfolder":
								$this->deleteSearchFolder($store, $entryid, $action);
								break;
							case "save":
								$this->save($store, $parententryid, $action);
								break;
						}
					} catch (MAPIException $e) {
						$this->processException($e, $actionType);
					}
				}
			}
		}
	}
?>
