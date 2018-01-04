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
		events:[],
		groups:{},
		items:{},
		config:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show'
		],
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'mobile.app.record.create.submit',
			'mobile.app.record.edit.submit',
			'app.record.index.edit.submit'
		]
	};
	var functions={
		/* item check */
		checkitem:function(event){
			var field=null;
			var trigger=event.record[vars.config['trigger']].value;
			if (trigger in vars.items)
			{
				for (var i=0;i<vars.items[trigger].autos.length;i++)
				{
					field=vars.items[trigger].autos[i];
					if (field.field in event.record)
					{
						switch (event.record[field.field].type)
						{
							case 'CHECK_BOX':
							case 'MULTI_SELECT':
								if ($.inArray(field.value,event.record[field.field].value)<0) event.record[field.field].value.push(field.value);
								break;
							default:
								event.record[field.field].value=field.value;
								event.record[field.field].lookup=true;
								break;
						}
					}
				}
				if (!(trigger in vars.groups))
				{
					vars.groups[trigger]=[];
					for (var i=0;i<vars.items[trigger].groups.length;i++)
					{
						field=$('body').fields(vars.items[trigger].groups[i],true)[0];
						vars.groups[trigger].push($('.group-label-gaia',field));
					}
				}
				$.each(vars.groups,function(key,values){
					for (var i=0;i<values.length;i++)
						if (values[i].attr('aria-expanded')==((key==trigger)?'false':'true')) values[i].trigger('click');
				});
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
		if (!('trigger' in vars.config))  return event;
		if (!('item' in vars.config))  return event;
		vars.items=JSON.parse(vars.config['item']);
		vars.events.push('app.record.create.change.'+vars.config['trigger']);
		vars.events.push('mobile.app.record.create.change.'+vars.config['trigger']);
		vars.events.push('app.record.edit.change.'+vars.config['trigger']);
		vars.events.push('mobile.app.record.edit.change.'+vars.config['trigger']);
		vars.events.push('app.record.index.edit.change.'+vars.config['trigger']);
		kintone.events.on(vars.events,function(event){
			return functions.checkitem(event);
		});
		return functions.checkitem(event);
	});
	kintone.events.on(events.save,function(event){
		if (!vars.config) return event;
		if (!('trigger' in vars.config))  return event;
		if (!('item' in vars.config))  return event;
		var error='';
		if (vars.config['trigger'] in event.record)
			if (event.record[vars.config['trigger']].value in vars.items)
			{
				for (var i=0;i<vars.items[event.record[vars.config['trigger']].value].requires.length;i++)
				{
					var field=vars.items[event.record[vars.config['trigger']].value].requires[i];
					if (field in event.record)
					{
						if (error.length==0 && !event.record[field].value) error='必須項目です。';
						if (error.length==0 && event.record[field].value.length==0) error='必須項目です。';
						if (error.length!=0) event.record[field].error=error;
					}
				}
				if (error.length!=0) event.error='未入力項目があります。';
			}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
