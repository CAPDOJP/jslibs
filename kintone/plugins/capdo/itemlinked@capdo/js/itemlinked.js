/*
*--------------------------------------------------------------------
* jQuery-Plugin "itemlinked"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		fields:[],
		items:[],
		config:{}
	};
	var events={
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'mobile.app.record.create.submit',
			'mobile.app.record.edit.submit'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.save,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('trigger' in vars.config))  return event;
		if (!('item' in vars.config))  return event;
		var error='';
		vars.items=JSON.parse(vars.config['item']);
		if (vars.config['trigger'] in event.record)
			if (event.record[vars.config['trigger']].value in vars.items)
			{
				vars.fields=vars.items[event.record[vars.config['trigger']].value].split(',');
				for (var i=0;i<vars.fields.length;i++)
				{
					if (error.length==0 && !event.record[vars.fields[i]].value) error='必須項目です。';
					if (error.length==0 && event.record[vars.fields[i]].value.length==0) error='必須項目です。';
					if (error.length!=0) event.record[vars.fields[i]].error=error;
				}
				if (error.length!=0) event.error='未入力項目があります。';
			}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
