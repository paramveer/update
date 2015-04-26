EnsureNamespace("Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask");

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums = {};
Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.Mode = 
{
	"Positions":	0,
	"Pricing":		1
};
Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.FieldFormValueNames =
{
	"3":	"PosNo",
	"4":	"MatNo",
	"10":	"Quantity",
	"7038":	"ShortText",
	"7001":	"LVNo",
	"7002":	"AltPosNo",
	"7003":	"SupPosNo",
	"21":	"Optional",
	"7008":	"BasicNetPrice",
	"7009":	"NetPrice",
	"7011":	"AddRebate",
	"7016":	"MarginSTP",
	"7017":	"MarginLSV"
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedPositionRecordId = "";
Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedLampTypeRecordId = "";
Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.RecordIdQuoteHeader = "";
Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.LanguageCatalogValueOfQuoteHeader = "";
Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl = "";
Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Mode = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.Mode.Positions;

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.FormHook = function(wnd, formControl, message, param)
{
	if (message == FORM_MSG_INITIALIZED)
	{
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.RecordIdQuoteHeader = formControl.GetRecordId();
		
		var infoAreaQuoteHeader = formControl.GetInfoArea();	//rp, 12.03.2015: support for VPR5
		//rp: read the language from the parent quote
		var QuoteHeaderRecord = Controller.Sensix.Utilities.GetRecord(infoAreaQuoteHeader, Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.RecordIdQuoteHeader, null, null, [33], true);	//PR#33...language
		var QuoteHeaderValues = QuoteHeaderRecord.GetFieldValues();
		if(QuoteHeaderValues.length > 0)
		{
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.LanguageCatalogValueOfQuoteHeader = QuoteHeaderValues[0];
		}
		
		// attach a list eventhandler
		var listInfo = formControl.GetAddInfoOfValueName("itemLines");
		formControl.RedrawItemById(listInfo.Id, listInfo.Func);
		
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl = listInfo.Object.GetListControl();
		if (Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl != null)
		{
			if (Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl.OnSelectChange.IsEmpty())
			{
				Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl.OnSelectChange.Add(_listSelectChangeToEditMode);
			}
			// remove possible callback first
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl.OnDeleted.Remove(_listDeleteRow);
			// add it again
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl.OnDeleted.Add(_listDeleteRow);
		}

		function _validationHandler(e)
		{
			e = GetWorkFrame().event || e;
			if((e.type == "keyup" && e.keyCode == 13) || e.type == "focusout")	//enter
			{
				//rp: not beautiful, but working: on the checkbox, the event will be fired in the IMG element (though attached to the checkbox element), but this element has neither id nor a value...so we have to use the parentElement, which is the checkbox
				var srcElement = e.srcElement.tagName === "IMG" ? e.srcElement.parentElement : e.srcElement;
				//var triggerfield = formControl.GetAddInfo(srcElement.id.substring(formControl.GetNamespace().length+1).split('_')).valuename;
				//rp: obsolete...we always try to save, which executes the validation anyway
				//_validateField(srcElement);
				_sendSaveRequest(srcElement);
			}
			e.cancelBubble=true;
		}
		
		function _attachValidationEvents()
		{
			var valueNames = new Array("PosNo", "MatNo", "Quantity", "ShortText", "LVNo", "AltPosNo", "SupPosNo", "Optional", "BasicNetPrice", "NetPrice", "AddRebate", "MarginSTP", "MarginLSV");
			for(var i=0; i<valueNames.length; i++)
			{
				var el = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.GetDOMElementOfFormValueName(formControl, valueNames[i]);
				switch(valueNames[i])
				{
					case "MarginLSV":
					case "Optional":
						//rp: handle onfocusout on checkbox...
						el.attachEvent('onfocusout', _validationHandler);						
					default:
						//rp: attach event handler for onkeyup event
						el.attachEvent('onkeyup', _validationHandler);
				}
			}
		}
		_attachValidationEvents();

		//rp: set focus on material no
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFocus("MatNo", formControl, wnd);
		
		//rp: add an event handler for the autoCompleters OnChange-event, which will be fired if a single value was determined.
		//this handler writes the text to the short text field
		var autoCompleter = formControl.GetAddInfoOfValueName("MatNo").Object.GetAutoCompleter();
		autoCompleter.OnChange.Add(function(autoCompleterControl, eventArgs)
		{
			var values = eventArgs.value.split('|');
			if(values.length == 3)
			{
				formControl.SetValueFromValueName("ShortText", values[2]);
			}
		});
		
		//rp: obsolete...we always try to save, which executes the validation anyway
/* 		function _validateField(el)
		{
			//build request
			var requestData = _buildRequestData();

			QuoteApproval.VerifyPosition (null, "PR", Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.RecordIdQuoteHeader, "AP", Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedPositionRecordId, 0, requestData, _OnVerifyPositionFinished);
						
			function _OnVerifyPositionFinished(requestParams, response)
			{
				if(response.BusinessRules)
				{
					for(var i = 0; i < response.BusinessRules.length; i++)
					{
						var br = response.BusinessRules[i];
						
						if(br.Status != 'Success' && br.Actions.length > 0)
						{
							for(var j = 0; j < br.Actions.length; j++)
							{
								var action = br.Actions[j];
								
								switch (action.Type) {
									case g_ACTION_ERRORMSG:
										MessageBox_ShowError(wnd, action.Data, "Ok");
										break;
									case g_ACTION_DONTSAVE:
										//alert("Dont save");
										break;
									case g_ACTION_BLOCKFIELD:
										//alert("ToggleFields");
										//ToggleFields(div_details, action.Data, true);
										break;
									case g_ACTION_UNBLOCKFIELD:
										//alert("ToggleFields");
										//ToggleFields(div_details, action.Data, false);
										break;
									case g_ACTION_SETFIELDVALUE:
										//alert("Set fields");
										//SetFieldValues(detailsCtrl,action.Data);
										break;
									case g_ACTION_CHECKCONFIRM:
										MessageBox_ShowInfo(wnd, action.Data, "Ok");
										break;
								}
							}
						}
					}
				}
				else if(response.Exception)
				{
					MessageBox_ShowError(wnd, response.Exception.Text, "Ok");
				}
			}			
		} */

		function _sendSaveRequest(el)
		{
			//build request
			var requestData = _buildRequestData();			
			
			//send save request
			alert(’sending save request');
			QuoteApproval.SavePosition (null, "PR", Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.RecordIdQuoteHeader, "AP", Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedPositionRecordId, 0, requestData, _OnSavePositionFinished);
			
			function _OnSavePositionFinished(requestParams, response)
			{
				var overallSuccess = true;
				
				if(response && response.BusinessRules)
				{
					for(var i = 0; i < response.BusinessRules.length; i++)
					{
						var br = response.BusinessRules[i];
						
						if(br.Status != 'Success' && br.Actions.length > 0)
						{
							for(var j = 0; j < br.Actions.length; j++)
							{
								var action = br.Actions[j];
								
								switch (action.Type) {
									case g_ACTION_ERRORMSG:
										MessageBox_ShowError(wnd, action.Data, "Ok");
										//alert("1");
										break;
									case g_ACTION_DONTSAVE:
										overallSuccess = false;
										//alert("2 dontsave");
										break;
									case g_ACTION_BLOCKFIELD:
										Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFieldsDisabled(formControl, wnd, action.Data, true);
										//alert("3 blockfield");
										break;
									case g_ACTION_UNBLOCKFIELD:
										Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFieldsDisabled(formControl, wnd, action.Data, false);
										//alert("4 unblockfield");
										break;
									case g_ACTION_SETFIELDVALUE:
										Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFieldValues(formControl, action.Data);
										//alert("5 setfieldvalue");
										
										break;
									case g_ACTION_CHECKCONFIRM:
										MessageBox_ShowInfo(wnd, action.Data, "Ok");
										//alert("6 checkconfirm");
										break;
								}
							}
						}
					}
					if(Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl)
					{
						if(overallSuccess)	//rp: only refresh the list, if the record was saved successfully
						{
							Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl.Refresh();
							Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedPositionRecordId = "";
							Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ClearInput(formControl, wnd);
						}												
					}
				}
				else if(response && response.Exception)
				{
					MessageBox_ShowError(wnd, response.Exception.Text, "Ok");
				}
			}
		}
		
		function _buildRequestData()
		{
			formControl.UpdateFormValues();
			
			var oArray = []; 
			var dataJSON = "";
			
			var sPosNo = formControl.GetValueByName("PosNo");
			var sMaterialNo = (formControl.GetValueByName("MatNo").indexOf('|') > 0) ? formControl.GetValueByName("MatNo").split('|')[0] : formControl.GetValueByName("MatNo");
			var iQuantity = formControl.GetValueByName("Quantity");
			var sShortText = formControl.GetValueByName("ShortText");
			var sLVNumber = formControl.GetValueByName("LVNo");
			var iAlternatePosNo = formControl.GetValueByName("AltPosNo");
			var iSuperiorPosNo = formControl.GetValueByName("SupPosNo");
			var bOptionalPos = formControl.GetValueByName("Optional") === "true" ? true : false;
			
			var sLampType = formControl.GetValueByName('LampType');
			var sLampTypeRecordId = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedLampTypeRecordId;
			
			var fBasicNetPrice = formControl.GetValueByName("BasicNetPrice");
			var fNetPrice = formControl.GetValueByName("NetPrice");
			var fAddRebate = formControl.GetValueByName("AddRebate");
			var fMarginSTP = formControl.GetValueByName("MarginSTP");
			var fMarginLSV = formControl.GetValueByName("MarginLSV");
			
			if(bDebug)
			{
				alert("Pos No:"+sPosNo+"\nMaterial No: "+sMaterialNo+"\nQuantity: "+iQuantity+"\nSuperior Pos No: "+iSuperiorPosNo+"\nAlternate Pos No: "+iAlternatePosNo+"\nOptional Pos: "+bOptionalPos);
			}		
			
			// generate JSON request
			var fieldvalues = 
			{
				"3":	sPosNo,
				"4":	sMaterialNo,
				"10":	iQuantity,
				"7038":	sShortText,
				"7001":	sLVNumber,
				"7002":	iAlternatePosNo,
				"7003":	iSuperiorPosNo,
				"21":	bOptionalPos,
			    "7008": fBasicNetPrice,
				"7009": fNetPrice,
				"7011": fAddRebate,
				"7016": fMarginSTP,
				"7017": fMarginLSV
			};
			
			var item = { 
				"Fieldvalues": fieldvalues, 
				"LampType": sLampType,
				"LampTypeRecordId": sLampTypeRecordId
			}; 

			oArray.push(item); 		
			dataJSON = JSON.Serialize(oArray); 			
			
			return dataJSON;
		}
		
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.DisableButton(formControl, wnd, "btnPositions");
	}
	
	function _listDeleteRow()
	{
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedPositionRecordId = "";
	}

	function _listSelectChangeToEditMode()
	{
                alert("list select change to edit mode");
		var selectedLine = arguments[1];
		var lineData = selectedLine.SelectedLineData;

		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedPositionRecordId = selectedLine.RecordId;
		
		//general fields
		formControl.SetValueFromValueName("PosNo", lineData[0]);
		formControl.SetValueFromValueName("MatNo", lineData[1]);
		formControl.SetValueFromValueName("Quantity", lineData[2]);
		formControl.SetValueFromValueName("ShortText", lineData[3]);

		//fields for position mode
		formControl.SetValueFromValueName("LVNo", lineData[4]);
		formControl.SetValueFromValueName("AltPosNo", lineData[5]);
		formControl.SetValueFromValueName("SupPosNo", lineData[6]);
		formControl.SetValueFromValueName("Optional", lineData[7] == g_cYes ? true : false);

		//pricing fields
		formControl.SetValueFromValueName("BasicNetPrice", lineData[8]);
		formControl.SetValueFromValueName("NetPrice", lineData[9]);
		formControl.SetValueFromValueName("AddRebate", lineData[10]);		
		formControl.SetValueFromValueName("MarginSTP", lineData[11]);		
		formControl.SetValueFromValueName("MarginLSV", lineData[12]);		

		//rp: set focus on quantity
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFocus("Quantity", formControl, wnd, true);

		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.OnLampTypeChanged(wnd, formControl);
	}
};
Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.OnLampTypeChanged = function(wnd, formControl)
{
	formControl.UpdateFormValues();
	var lampTypeCatCode = formControl.GetValueByName('LampType');
	var lampTypeExtCode = new CatalogsControl(wnd).CodeToExtKey(1040, lampTypeCatCode, null, true);
	if(lampTypeExtCode == "9001_1040_3" && (Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedPositionRecordId != null && Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedPositionRecordId != ""))	//9001_1040_3..."Search"
	{
		var options = { InfoArea: 'C001', SearchFieldGroup: 'C001', ParentRecord: { InfoArea: "AP", RecID: Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedPositionRecordId, RelationName: "$Link[AR]" }, AutoStart: true};
		var recordSelector = new RecordSelector(options);
		recordSelector.OnSelected.Add(
		function ()
		{
			Controller.Log(arguments.length);
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedLampTypeRecordId = arguments[1].Link.RecId;
			//rp: focus and select quantity field
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFocus("Quantity", formControl, wnd, true);
		}
		);
		recordSelector.Show(window);
	}
	else
	{
		//rp: focus and select quantity field
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFocus("Quantity", formControl, wnd, true);
	}
}

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ItemMasterAutoCompleteDataProviderClass = function(field, options, autoCompleter, command)
{
	var _self = this;	
	this.AutoComplete = function (value, callback)
	{		

		var queryControl = new QueryControl("", "", GetWorkFrame());

		var nodeARroot = queryControl.AddInfoArea("AR", [0, 7000], null, -1);	//AR#0...Mat. No; AR#1...Item Desc.; AR#7000...Old Mat. No.
		var nodeATRoot = queryControl.AddInfoArea("AT", [3], null, nodeARroot, "PLUS");
		
		//var nodeARroot = queryControl.AddInfoArea("AR", [0], null, -1);	//AR#0...Mat. No
		var nodeAT = queryControl.AddInfoArea("AT", null, null, nodeARroot, "HAVING", [1, 0], 0);
		var nodeAR = queryControl.AddInfoArea("AR", null, null, nodeARroot, "HAVING", [1, 0], 0);
		
		var filterNodeItemDesc = queryControl.AddFilterEx("AT", nodeAT, "OR", 3, "C", "=", value + '*');	//AT#3...Description
		//rp: this field will not be used any more
		//var filterNodeItemLongText = queryControl.AddFilterEx("AT", filterNodeItemDesc, "OR", 10001, "C", "=", value + '*');	//AT#10001...Long Text
		// var languageRecord = Controller.Sensix.Utilities.GetRecord("00", g_nLanguageCatalogValue, null, null, [2], true);
		// var languageValues = languageRecord.GetFieldValues();
		// if(languageValues.length > 0)
		// {
			// var filterNodeLanguage = queryControl.AddFilterEx("AT", filterNodeItemDesc, "AND", 1, "K", "=", languageValues[0]);	//AT#1...Language
			// var filterNodeLanguage = queryControl.AddFilterEx("AT", nodeATRoot, "AND", 1, "K", "=", languageValues[0]);	//AT#1...Language
		// }
		// else
		// {
			// Controller.Log("No language catalog code found for current login language " + g_nLanguageCatalogValue);
		// }
		var filterNodeLanguage = queryControl.AddFilterEx("AT", filterNodeItemDesc, "AND", 1, "K", "=", Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.LanguageCatalogValueOfQuoteHeader);	//AT#1...Language
		var filterNodeLanguage = queryControl.AddFilterEx("AT", nodeATRoot, "AND", 1, "K", "=", Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.LanguageCatalogValueOfQuoteHeader);	//AT#1...Language
		
		var filterNodeMatNo = queryControl.AddFilterEx("AR", nodeAR, "OR", 0, "C", "=", value + '*');	//AR#0...Mat. No.
		var filterNodeOldMatNo = queryControl.AddFilterEx("AR", filterNodeMatNo, "OR", 7000, "C", "=", value + '*');	//AR#7000...Old Mat. NO
		
		var recordSet = new RecordSet(GetWorkFrame());

		recordSet.SetNotifyObject(_onItemsRead);

		recordSet.ExecuteQuery(queryControl, 10);
			
		function _onItemsRead(recordSet, result)
		{
			if (!result.Success)
			{
				Controller.Log("no items found for search value " + value);
				callback(null);
			}
			else
			{
				var enumerator = recordSet.CreateEnumerator();
				var _foundValues = [];
				while(enumerator.MoveNext())
				{
					var values = enumerator.GetValues();					
					_foundValues[_foundValues.length] = values.join('|');
				}
				callback(_foundValues);
			}
		}
	};
	
	//rp: this method needs explanation...
	//when the autoCompleter finds exactly one record and the user tabs out (and only then), if fires the AutoComplete() method of the dataProvider unless this method exists.
	//The problem is, that the AutoComplete() method gets the final value as parameter, which is the concatenated string with pipes and therefore it finds no values and empties the field...
	this.GetValue = function(value, callback)
	{
		//value = value.substring(0, value.lastIndexOf('|'));
		callback(value);
	};
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.OnFinishedButtonClicked = function(msg, param, window, addinfo, form, el)
{	
	Controller.goBack();
}

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ShowMaterialSelector = function (src, formControl, wnd, options)
{
	var recordSelector = new RecordSelector(options);

	recordSelector.OnSelected.Add(
		function (selector, recordLink)
		{
			//rp: set value from selector on form field -> this usually doesn't work, since the AutoCompleter doesn't support .ValueToForm()...but I have implemented it there
			formControl.SetValueFromValueName("MatNo", recordLink.Link.CopyFieldValues[0] + '|' + recordLink.Link.CopyFieldValues[1] + '|' + recordLink.Link.CopyFieldValues[2]);
			
			Controller.Sensix.Utilities.ReadRecord("AT", "AR", recordLink.Link.RecId, -1, [3], [["AT", 1, "K", "=", Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.LanguageCatalogValueOfQuoteHeader]], 1, src, null,
			function(recordSet, result)
			{
				if (result.Success)
				{
					var enumerator = recordSet.CreateEnumerator();
					var values;
					while(enumerator.MoveNext())
					{
						values = enumerator.GetValues();					
					}
					//rp: set the short text
					formControl.SetValueFromValueName("ShortText", values[0]);
				}
			});
	
			//rp: set focus on quality field
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFocus("Quantity", formControl, wnd);
		}
	);
	recordSelector.Show(src);
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFocus = function(valueName, formControl, wnd, selectField)
{
	var el = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.GetDOMElementOfFormValueName(formControl, valueName);

	if(el)
	{
		el.focus();
	}
	if(selectField && el)
	{
		//el.select();	//rp: this only works for every second record I select in the list...
		//el.setSelectionRange(0, el.value.length);	//rp: not supported in IE9 quirks mode...and u7 doesn't support IE9 strict mode :(
		wnd.setTimeout(function()
		{ 
			el.select(); 
		},10);	//rp: finally, this works on every click
	}
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ClearInput = function(formControl, wnd)
{
		//TODO: unselect selected row in list control if possible
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SelectedPositionRecordId = "";
		
		formControl.SetValueFromValueName("PosNo", "");
		formControl.SetValueFromValueName("MatNo", "");
		formControl.SetValueFromValueName("Quantity", "");
		formControl.SetValueFromValueName("ShortText", "");
		formControl.SetValueFromValueName("LVNo", "");
		formControl.SetValueFromValueName("AltPosNo", "");
		formControl.SetValueFromValueName("SupPosNo", "");
		formControl.SetValueFromValueName("Optional", false);
		//pricing fields
		formControl.SetValueFromValueName("BasicNetPrice", "");
		formControl.SetValueFromValueName("NetPrice", "");
		formControl.SetValueFromValueName("AddRebate", "");
		formControl.SetValueFromValueName("MarginSTP", "");
		formControl.SetValueFromValueName("MarginLSV", "");
		
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFocus("MatNo", formControl, wnd);
}

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.OnPricingButtonClicked = function(msg, param, wnd, addinfo, formControl, el)
{	
     alert("clicked on Pricing");
     Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Mode = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.Mode.Positions;
	if(Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Mode == Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.Mode.Positions)
	{
		//alert("Before running the workflow");
		
		Controller.Workflow.ExecuteTrigger("PR_INT_S60 [AJ]", "PR", Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.RecordIdQuoteHeader, function()
		{			
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.DisableButton(formControl, wnd, "btnPricing");
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.EnableButton(formControl, wnd, "btnPositions");
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ToggleFieldsVisibility(formControl, wnd, Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.Mode.Pricing);
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl.SetSearchType('APRapidEntryQuotePositionMask_Pricing');
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl.Refresh();
			Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Mode = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.Mode.Pricing;
		});
	}
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.OnPositionHandlingButtonClicked = function(msg, param, wnd, addinfo, formControl, el)
{
	if(Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Mode == Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.Mode.Pricing)
	{		
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.DisableButton(formControl, wnd, "btnPositions");
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.EnableButton(formControl, wnd, "btnPricing");
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ToggleFieldsVisibility(formControl, wnd, Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.Mode.Positions);
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl.SetSearchType('APRapidEntryQuotePositionMask');
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ListControl.Refresh();
		Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Mode = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.Mode.Positions;
	}
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.EnableButton = function(formControl, wnd, buttonValueName)
{
	var el = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.GetDOMElementOfFormValueName(formControl, buttonValueName);
	if(el)
	{
		el.disabled = false;
		el.className = "Button_Box";
		return true;
	}
	return false;
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.DisableButton = function(formControl, wnd, buttonValueName)
{
	var el = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.GetDOMElementOfFormValueName(formControl, buttonValueName);
	if(el)
	{
		el.disabled = true;
		el.className = "Button_BoxDisabled";
		return true;
	}
	return false;
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.ToggleFieldsVisibility = function(formControl, wnd)
{
	var valueNames = new Array("PosNo", "MatNo", "Quantity", "ShortText", "LVNo", "AltPosNo", "SupPosNo", "Optional", "BasicNetPrice", "NetPrice", "AddRebate", "MarginSTP", "MarginLSV");
	var startIndex = 4;
	var endIndex = valueNames.length;

	for(var i=startIndex; i<endIndex; i++)
	{
		var el = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.GetDOMElementOfFormValueName(formControl, valueNames[i]);
		var elLbl = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.GetDOMElementOfFormValueName(formControl, 'lbl' + valueNames[i]);
		if(el)
		{
			//get the surrounding TD...bubbling up is needed for eg. checkboxes
			var parent = el.parentNode;
			while(parent)
			{
				if(parent.nodeName.toLowerCase() === "td")
				{
					el = parent;
					break;
				}
				parent = parent.parentNode;
			}
			//bubbling not needed for labels
			elLbl = elLbl.parentNode;
		}
		el.style.display = (el.style.display != 'none' ? 'none' : '' );
		elLbl.style.display = (elLbl.style.display != 'none' ? 'none' : '' );
	}
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.GetDOMElementOfFormValueName = function(formControl, valueName)
{
	var addInfo = formControl.GetAddInfoOfValueName(valueName);
	var el = formControl.GetCallerWindow().$(addInfo.Namespace);
	
	return el;
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFieldsDisabled = function(formControl, wnd, fields, disable)
{
	for(var i = 0; i < fields.length; i++)
	{
		var el = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.GetDOMElementOfFormValueName(formControl, Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.FieldFormValueNames[fields[i]]);
		if(el)
		{
			el.disabled = disable;
			el.className = disable ? "Fields_InputDisabled" : "Fields_Input";
		}
	}
};

Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.SetFieldValues = function(formControl, dictionary)
{
	var fieldvalues = new Object();
	
	for (var key in dictionary) 
	{
		if (dictionary.hasOwnProperty(key))  
		{			
			var value = dictionary[key];  // Need to check dictionary object array
			
			var valueName = Controller.Zumtobel.Update.QuoteManagement.RapidEntryQuotePositionMask.Enums.FieldFormValueNames[key];
			formControl.SetValueFromValueName(valueName,value);
		}
	}
};
