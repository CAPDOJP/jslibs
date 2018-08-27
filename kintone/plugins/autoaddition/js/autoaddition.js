/*
*--------------------------------------------------------------------
* jQuery-Plugin "autoaddition"
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
		additions:[],
		config:{},
		fieldinfos:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('additions' in vars.config)) return event;
		/* initialize valiable */
		vars.additions=JSON.parse(vars.config['additions']);
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=resp.properties;
			/* setup buttons */
			for (var i=0;i<vars.additions.length;i++)
			{
				var addition=vars.additions[i];
				if (addition in vars.fieldinfos)
				{
					var events=[];
					var fields=vars.fieldinfos[addition].fields;
					for (var key in fields)
					{
						events.push('app.record.create.change.'+key);
						events.push('app.record.edit.change.'+key);
					}
					(function(addition,fields,events){
						kintone.events.on(events,function(event){
							var rows=event.record[addition].value;
							if (!$.isemptyrow(rows[rows.length-1].value,fields)) rows.push($.createrow(fields));
							return event;
						});
					})(addition,fields,events)
				}
			}
		},function(error){
			swal('Error!',error.message,'error');
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
