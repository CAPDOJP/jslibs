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
		fields:[],
		groups:{},
		config:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.detail.show',
			'app.record.edit.show',
			'mobile.app.record.create.show',
			'mobile.app.record.detail.show',
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
		/* setting check */
		checksetting:function(event,isdetail){
			for (var i=0;i<vars.fields.length;i++)
			{
				var items=[];
				var opened=[];
				var settings=vars.fields[i]['setting'];
				switch (event.record[vars.fields[i]['field']].type)
				{
					case 'CHECK_BOX':
					case 'MULTI_SELECT':
						items=event.record[vars.fields[i]['field']].value;
						break;
					case 'DROP_DOWN':
					case 'RADIO_BUTTON':
						items.push(event.record[vars.fields[i]['field']].value);
						break;
				}
				if (!isdetail)
					for (var i2=0;i2<items.length;i2++)
						if (items[i2] in settings)
						{
							for (var i3=0;i3<settings[items[i2]].autos.length;i3++)
							{
								var field=settings[items[i2]].autos[i3];
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
					for (var i2=0;i2<values.length;i2++)
					{
						switch (event.record[vars.fields[i]['field']].type)
						{
							case 'CHECK_BOX':
							case 'MULTI_SELECT':
								if ($.inArray(key,items)>-1)
								{
									if (values[i2].attr('aria-expanded')=='false') values[i2].trigger('click');
									opened.push(values[i2][0]);
								}
								break;
							case 'DROP_DOWN':
							case 'RADIO_BUTTON':
								if (key==items[0])
								{
									if (values[i2].attr('aria-expanded')=='false') values[i2].trigger('click');
									opened.push(values[i2][0]);
								}
								break;
						}
					}
				});
				$.each(vars.groups,function(key,values){
					for (var i2=0;i2<values.length;i2++)
						if ($.inArray(values[i2][0],opened)==-1)
							if (values[i2].attr('aria-expanded')=='true') values[i2].trigger('click');
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
		if (!('fields' in vars.config))  return event;
		vars.fields=JSON.parse(vars.config['fields']);
		for (var i=0;i<vars.fields.length;i++)
		{
			var settings=vars.fields[i]['setting'];
			vars.events.push('app.record.create.change.'+vars.fields[i]['field']);
			vars.events.push('mobile.app.record.create.change.'+vars.fields[i]['field']);
			vars.events.push('app.record.edit.change.'+vars.fields[i]['field']);
			vars.events.push('mobile.app.record.edit.change.'+vars.fields[i]['field']);
			vars.events.push('app.record.index.edit.change.'+vars.fields[i]['field']);
			kintone.events.on(vars.events,function(event){
				return functions.checksetting(event);
			});
			$.each(settings,function(key,values){
				vars.groups[key]=[];
				for (var i2=0;i2<values.groups.length;i2++)
					vars.groups[key].push($('.group-label-gaia',$('body').fields(values.groups[i2],true)[0]));
			});
		}
		return functions.checksetting(event,event.type.match(/detail/g));
	});
	kintone.events.on(events.save,function(event){
		if (!vars.config) return event;
		if (!('fields' in vars.config))  return event;
		vars.fields=JSON.parse(vars.config['fields']);
		for (var i=0;i<vars.fields.length;i++)
		{
			var error='';
			var items=[];
			var settings=vars.fields[i]['setting'];
			if (vars.fields[i]['field'] in event.record)
			{
				switch (event.record[vars.fields[i]['field']].type)
				{
					case 'CHECK_BOX':
					case 'MULTI_SELECT':
						items=event.record[vars.fields[i]['field']].value;
						break;
					case 'DROP_DOWN':
					case 'RADIO_BUTTON':
						items.push(event.record[vars.fields[i]['field']].value);
						break;
				}
				for (var i2=0;i2<items.length;i2++)
					if (items[i2] in settings)
					{
						for (var i3=0;i3<settings[items[i2]].requires.length;i3++)
						{
							var field=settings[items[i2]].requires[i3];
							if (field in event.record)
							{
								if (error.length==0 && !event.record[field].value) error='必須項目です。';
								if (error.length!=0) event.record[field].error=error;
							}
						}
						if (error.length!=0) event.error='未入力項目があります。';
					}
			}
		}
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
