/*
*--------------------------------------------------------------------
* jQuery-Plugin "referenceupdate"
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
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'mobile.app.record.create.submit',
			'mobile.app.record.edit.submit',
			'app.record.index.edit.submit'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.save,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		var lookups=JSON.parse(vars.config['lookups']);
		return new kintone.Promise(function(resolve,reject){
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				var counter=lookups.length;
				for (var i=0;i<lookups.length;i++)
				{
					var lookup=lookups[i]['lookup'];
					if (lookup in event.record)
					{
						if (!event.record[lookup].value)
						{
							counter--;
							continue;
						}
						if (event.record[lookup].value.length==0)
						{
							counter--;
							continue;
						}
						var record={};
						$.each(lookups[i]['setting'],function(key,values){
							if (values in event.record) record[key]={value:event.record[values].value};
						});
						switch (lookups[i]['type'])
						{
							case 'RECORD_NUMBER':
								var body={
									app:resp.properties[lookup].lookup.relatedApp.app,
									id:event.record[lookup].value,
									record:record
								};
								break;
							default:
								var body={
									app:resp.properties[lookup].lookup.relatedApp.app,
									updateKey:{
										field:resp.properties[lookup].lookup.relatedKeyField,
										value:event.record[lookup].value
									},
									record:record
								};
								break;
						}
						(function(body,success,fail){
							kintone.api(kintone.api.url('/k/v1/record',true),'PUT',body,function(resp){
								counter--;
								if (counter==0) success();
							},function(error){
								swal('Error!',error.message,'error');
								fail();
							});
						})(body,function(){
							resolve(event);
						},function(){
							reject(new Error('reference source update error'));
						});
					}
					else counter--;
				}
				if (counter==0) resolve(event);
			},function(error){});
		});
	});
})(jQuery,kintone.$PLUGIN_ID);
