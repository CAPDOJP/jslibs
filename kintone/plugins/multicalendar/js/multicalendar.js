/*
*--------------------------------------------------------------------
* jQuery-Plugin "multicalendar"
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
		calendar:null,
		fields:[],
		fieldinfos:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show'
		]
	};
	var limit=500;
	var functions={
		/* append buttons */
		appendbuttons:function(fieldcode){
			$.each($('body').fields(fieldcode),function(){
				var target=$(this).addClass('multicalendar');
				if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
				if ($.data(target[0],'added')) return true;
				var buttons={
					calendar:$('<button class="customoperation-button calendar">').on('click',function(){
						var target=$(this);
						vars.calendar.show({
							activedates:target.closest('div').find('.multicalendar').val().split(','),
							buttons:{
								ok:function(selection){
									target.closest('div').find('.multicalendar').val(selection.join(','));
									/* close calendar */
									vars.calendar.hide();
								},
								cancel:function(){
									/* close calendar */
									vars.calendar.hide();
								}
							}
						});
					}),
					clear:$('<button class="customoperation-button clear">').on('click',function(){
						$(this).closest('div').find('.multicalendar').val('');
					})
				}
				/* adjust button size */
				var height=target.outerHeight(false);
				$.each(buttons,function(key,values){
					if (height-30>0)
					{
						values.css({
							'margin':((height-30)/2).toString()+'px',
							'min-height':'30px',
							'min-width':'30px'
						});
					}
					else
					{
						values.css({
							'background-size':height.toString()+'px '+height.toString()+'px',
							'margin':'0px',
							'min-height':height.toString()+'px',
							'min-width':height.toString()+'px'
						});
					}
				})
				target.closest('div').append(buttons.calendar).append(buttons.clear);
				target.css({'padding-right':(buttons.calendar.outerWidth(true)+buttons.clear.outerWidth(true)).toString()+'px'});
				buttons.calendar.css({'right':buttons.clear.outerWidth(true).toString()+'px'});
				$.data(target[0],'added',true);
			});
		},
		/* get field sorted index */
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
					case 'SUBTABLE':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
				}
			});
			return codes;
		},
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* day pickup button */
		vars.calendar=$('body').calendar({
			multi:true,
			span:vars.config['span']
		});
		/* get layout */
		kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
			var sorted=functions.fieldsort(resp.layout);
			/* get fieldinfo */
			kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
				vars.fields=vars.config['field'].split(',');
				vars.fieldinfos=$.fieldparallelize(resp.properties);
				$.each(sorted,function(index){
					if ($.inArray(sorted[index],vars.fields)>-1 && (sorted[index] in vars.fieldinfos))
					{
						var fieldinfo=vars.fieldinfos[sorted[index]];
						/* append buttons */
						functions.appendbuttons(fieldinfo.code);
						if (fieldinfo.tablecode.length!=0)
						{
							var events=[];
							events.push('app.record.create.change.'+fieldinfo.tablecode);
							events.push('mobile.app.record.create.change.'+fieldinfo.tablecode);
							events.push('app.record.edit.change.'+fieldinfo.tablecode);
							events.push('mobile.app.record.edit.change.'+fieldinfo.tablecode);
							kintone.events.on(events,function(event){
								$.each(event.changes.row.value,function(key,values){
									for (var i=0;i<vars.fields.length;i++) if (key==vars.fields[i]) functions.appendbuttons(key);
								});
								return event;
							});
						}
					}
				});
			},function(error){});
		},function(error){});
	});
})(jQuery,kintone.$PLUGIN_ID);
