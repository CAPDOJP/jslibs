/*
*--------------------------------------------------------------------
* jQuery-Plugin "itemlinkedhidden"
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
		events:[],
		fields:[],
		config:{}
	};
	var events={
		show:[
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show',
			'mobile.app.record.detail.show'
		]
	};
	var functions={
		/* setting check */
		checksetting:function(event){
			for (var i=0;i<vars.fields.length;i++)
			{
				var settings=vars.fields[i]['setting'];
				$.each(settings,function(key,values){
					for (var i2=0;i2<values.length;i2++)
					{
						var field=values[i2];
						switch (field.type)
						{
							case 'REFERENCE_TABLE':
								kintone.mobile.app.record.setFieldShown(field.code,true);
								break;
							default:
								if (field.code in event.record) kintone.mobile.app.record.setFieldShown(field.code,true);
								break;
						}
					}
				});
			}
			for (var i=0;i<vars.fields.length;i++)
			{
				var item=event.record[vars.fields[i]['field']].value;
				var settings=vars.fields[i]['setting'];
				if (item in settings)
				{
					for (var i2=0;i2<settings[item].length;i2++)
					{
						var field=settings[item][i2];
						switch (field.type)
						{
							case 'REFERENCE_TABLE':
								kintone.mobile.app.record.setFieldShown(field.code,false);
								break;
							default:
								if (field.code in event.record) kintone.mobile.app.record.setFieldShown(field.code,false);
								break;
						}
					}
				}
			}
			return event;
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
	kintone.events.on(events.show,function(event){
		if (!vars.config) return event;
		if (!('fields' in vars.config))  return event;
		vars.fields=JSON.parse(vars.config['fields']);
		for (var i=0;i<vars.fields.length;i++)
		{
			vars.events.push('app.record.create.change.'+vars.fields[i]['field']);
			vars.events.push('mobile.app.record.create.change.'+vars.fields[i]['field']);
			vars.events.push('app.record.edit.change.'+vars.fields[i]['field']);
			vars.events.push('mobile.app.record.edit.change.'+vars.fields[i]['field']);
			vars.events.push('app.record.index.edit.change.'+vars.fields[i]['field']);
			kintone.events.on(vars.events,function(event){
				return functions.checksetting(event);
			});
		}
		return functions.checksetting(event);
	});
})(jQuery,kintone.$PLUGIN_ID);
