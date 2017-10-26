/*
*--------------------------------------------------------------------
* jQuery-Plugin "statuslinked"
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
	var events={
		process:[
			'app.record.detail.process.proceed'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.process,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		var fields=[];
		var statues=JSON.parse(vars.config['status']);
		if (event.nextStatus.value in statues)
		{
			fields=statuses[event.nextStatus.value].split(',');
			for (var i=0;i<fields.length;i++)
				if (event.record[fields[i]].value.length==0) event.record[fields[i]].error='必須項目です。';
		}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
