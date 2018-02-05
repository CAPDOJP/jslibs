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
			var triggers=[];
			var opened=[];
			switch (event.record[vars.config['trigger']].type)
			{
				case 'CHECK_BOX':
				case 'MULTI_SELECT':
					triggers=event.record[vars.config['trigger']].value;
					break;
				case 'DROP_DOWN':
				case 'RADIO_BUTTON':
					triggers.push(event.record[vars.config['trigger']].value);
					break;
			}
			for (var i=0;i<triggers.length;i++)
				if (triggers[i] in vars.items)
				{
					for (var i2=0;i2<vars.items[triggers[i]].autos.length;i2++)
					{
						field=vars.items[triggers[i]].autos[i2];
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
				}
			$.each(vars.groups,function(key,values){
				for (var i=0;i<values.length;i++)
				{
					switch (event.record[vars.config['trigger']].type)
					{
						case 'CHECK_BOX':
						case 'MULTI_SELECT':
							if ($.inArray(key,triggers)>-1)
							{
								if (values[i].attr('aria-expanded')=='false') values[i].trigger('click');
								opened.push(values[i][0]);
							}
							break;
						case 'DROP_DOWN':
						case 'RADIO_BUTTON':
							if (key==triggers[0])
							{
								if (values[i].attr('aria-expanded')=='false') values[i].trigger('click');
								opened.push(values[i][0]);
							}
							break;
					}
				}
			});
			$.each(vars.groups,function(key,values){
				for (var i=0;i<values.length;i++)
					if ($.inArray(values[i][0],opened)==-1)
						if (values[i].attr('aria-expanded')=='true') values[i].trigger('click');
			});
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
		$.each(vars.items,function(key,values){
			vars.groups[key]=[];
			for (var i=0;i<values.groups.length;i++)
				vars.groups[key].push($('.group-label-gaia',$('body').fields(values.groups[i],true)[0]));
		});
		return functions.checkitem(event);
	});
	kintone.events.on(events.save,function(event){
		if (!vars.config) return event;
		if (!('trigger' in vars.config))  return event;
		if (!('item' in vars.config))  return event;
		var error='';
		var triggers=[];
		if (vars.config['trigger'] in event.record)
		{
			switch (event.record[vars.config['trigger']].type)
			{
				case 'CHECK_BOX':
				case 'MULTI_SELECT':
					triggers=event.record[vars.config['trigger']].value;
					break;
				case 'DROP_DOWN':
				case 'RADIO_BUTTON':
					triggers.push(event.record[vars.config['trigger']].value);
					break;
			}
			for (var i=0;i<triggers.length;i++)
				if (triggers[i] in vars.items)
				{
					for (var i2=0;i2<vars.items[triggers[i]].requires.length;i2++)
					{
						var field=vars.items[triggers[i]].requires[i2];
						if (field in event.record)
						{
							if (error.length==0 && !event.record[field].value) error='必須項目です。';
							if (error.length==0 && event.record[field].value.length==0) error='必須項目です。';
							if (error.length!=0) event.record[field].error=error;
						}
					}
					if (error.length!=0) event.error='未入力項目があります。';
				}
		}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
