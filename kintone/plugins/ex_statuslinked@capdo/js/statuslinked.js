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
	var vars={
		config:{}
	};
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
		return new kintone.Promise(function(resolve,reject){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var fields=[];
				var statuses=JSON.parse(vars.config['status']);
				if (event.nextStatus.value in statuses)
				{
					fields=statuses[event.nextStatus.value].split(',');
					for (var i=0;i<fields.length;i++)
						if (fields[i] in resp.properties)
							if (event.record[fields[i]].value.length==0)
							{
								event.error=resp.properties[fields[i]].label+'を入力して下さい。';
								/* check field type */
								switch (resp.properties[fields[i]].type)
								{
									case 'DATE':
										break;
									case 'MULTI_LINE_TEXT':
										break;
									case 'SINGLE_LINE_TEXT':
										break;
								}
							}
				}
				resolve(event);
			},function(error){});
		});
	});
})(jQuery,kintone.$PLUGIN_ID);
