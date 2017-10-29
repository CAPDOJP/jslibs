/*
*--------------------------------------------------------------------
* jQuery-Plugin "datesynclist"
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
		relations:[],
		events:[],
		config:{}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
	if ('relation' in vars.config)
	{
		vars.relations=JSON.parse(vars.config['relation']);
		for (var i=0;i<vars.relations.length;i++)
		{
			vars.events.push('app.record.create.change.'+vars.relations[i].date);
			vars.events.push('mobile.app.record.create.change.'+vars.relations[i].date);
			vars.events.push('app.record.edit.change.'+vars.relations[i].date);
			vars.events.push('mobile.app.record.edit.change.'+vars.relations[i].date);
		}
		if (vars.events)
			kintone.events.on(vars.events,function(event){
				var type=event.type.split('.');
				for (var i=0;i<vars.relations.length;i++)
					if (type[type.length-1]==vars.relations[i].date)
					{
						var relation=vars.relations[i];
						if (event.record[relation.date].value) event.record[relation.dropdown].value=relation.item;
					}
				return event;
			});
	}
})(jQuery,kintone.$PLUGIN_ID);
