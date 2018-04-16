/*
*--------------------------------------------------------------------
* jQuery-Plugin "itemlinkedhidden -config.js-"
* Version: 3.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		fieldtable:null,
		fieldparams:[],
		fieldinfos:{},
	};
	var functions={
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
				}
			});
			return codes;
		},
		reloadsettings:function(params,callback){
			/* clear rows */
			var target=$('select#field',params.table.container.closest('tr'));
			params.hiddens=[];
			params.table.clearrows();
			if (target.val().length!=0)
			{
				var fieldinfo=vars.fieldinfos[target.val()];
				var options=[fieldinfo.options.length];
				$.each(fieldinfo.options,function(key,values){
					options[values.index]=values.label;
				});
				for (var i=0;i<options.length;i++)
				{
					params.table.addrow();
					params.table.rows.last().find('input#item').val(options[i]);
					params.table.rows.last().find('span.itemname').text(options[i]);
				}
				params.table.container.show();
				if (callback) callback();
			}
			else params.table.container.hide();
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
		var sorted=functions.fieldsort(resp.layout);
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					$('select#hiddenfield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'DROP_DOWN':
						case 'RADIO_BUTTON':
							$('select#field').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			vars.fieldtable=$('.fields').adjustabletable({
				add:'img.addfield',
				del:'img.delfield',
				addcallback:function(row){
					var index=(vars.fieldtable)?vars.fieldtable.rows.index(row):0;
					vars.fieldparams.push({
						table:null,
						hiddens:[]
					});
					vars.fieldparams[index].table=$('.settings',row).adjustabletable({
						addcallback:function(row){
							vars.fieldparams[index].hiddens.push(
								$('.hiddens',row).adjustabletable({
									add:'img.add',
									del:'img.del'
								})
							);
						}
					});
					$('select#field',row).on('change',function(){
						functions.reloadsettings(vars.fieldparams[index]);
					});
				},
				delcallback:function(index){
					vars.fieldparams.splice(index,1);
				}
			});
			var add=false;
			var row=null;
			var fields=[];
			var hiddens=[];
			var settings={};
			var params={};
			if (Object.keys(config).length!==0)
			{
				fields=JSON.parse(config['fields']);
				for (var i=0;i<fields.length;i++)
				{
					if (add) vars.fieldtable.addrow();
					else add=true;
					settings=fields[i]['setting'];
					params=vars.fieldparams[i];
					$('select#field',vars.fieldtable.rows.last()).val(fields[i]['field']);
					functions.reloadsettings(params,function(){
						for (var i2=0;i2<params.table.rows.length;i2++)
						{
							row=params.table.rows.eq(i2);
							if ($('#item',row).val() in settings)
							{
								hiddens=settings[$('#item',row).val()];
								add=false;
								for (var i3=0;i3<hiddens.length;i3++)
								{
									if (add) params.hiddens[i2].addrow();
									else add=true;
									$('select#hiddenfield',params.hiddens[i2].rows.last()).val(hiddens[i3]['code']);
								}
							}
						}
						add=true;
					});
				}
			}
			else vars.fieldparams[0].table.container.hide();
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var fieldinfo=null;
		var row=null;
		var config=[];
		var fields=[];
		var hiddens=[];
		var params={};
		/* check values */
		for (var i=0;i<vars.fieldtable.rows.length;i++)
		{
			var field={field:'',setting:{}};
			row=vars.fieldtable.rows.eq(i);
			params=vars.fieldparams[i];
			if ($('select#field',row).val()=='') continue;
			else field.field=$('select#field',row).val();
			for (var i2=0;i2<params.table.rows.length;i2++)
			{
				hiddens=[];
				for (var i3=0;i3<params.hiddens[i2].rows.length;i3++)
				{
					row=params.hiddens[i2].rows.eq(i3);
					if ($('select#hiddenfield',row).val().length==0) continue;
					hiddens.push({
						code:$('select#hiddenfield',row).val(),
						type:vars.fieldinfos[$('select#hiddenfield',row).val()].type
					});
				}
				field.setting[$('input#item',params.table.rows.eq(i2)).val()]=hiddens;
			}
			fields.push(field);
		}
		/* setup config */
		config['fields']=JSON.stringify(fields,'');
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);