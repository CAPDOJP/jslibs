/*
*--------------------------------------------------------------------
* jQuery-Plugin "multipicker -config.js-"
* Version: 1.0
* Copyright (c) 2017 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		settingtable:null,
		fieldinfos:{}
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
					case 'SUBTABLE':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
				}
			});
			return codes;
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
			var mappings=[];
			/* append lookup mappings fields */
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			$.each(vars.fieldinfos,function(key,values){
				if (values.lookup)
					$.each(values.lookup.fieldMappings,function(index,values){
						mappings.push(values.field);
					});
			});
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'SINGLE_LINE_TEXT':
							/* exclude lookup */
							if (!fieldinfo.lookup)
								if ($.inArray(fieldinfo.code,mappings)<0) $('select#connected').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
					if (fieldinfo.lookup) $('select#lookup').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
				}
			});
			/* initialize valiable */
			vars.settingtable=$('.settings').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var add=false;
			var row=null;
			var settings=[];
			if (Object.keys(config).length!==0)
			{
				settings=JSON.parse(config['settings']);
				$.each(settings,function(index){
					if (add) vars.settingtable.addrow();
					else add=true;
					row=vars.settingtable.rows.last();
					$('select#lookup',row).val(settings[index].lookup);
					$('select#connected',row).val(settings[index].connected);
				});
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var settings=[];
		/* check values */
		for (var i=0;i<vars.settingtable.rows.length;i++)
		{
			row=vars.settingtable.rows.eq(i);
			if (!$('select#lookup',row).val()) continue;
			if (!$('select#connected',row).val()) continue;
			if (vars.fieldinfos[$('select#lookup',row).val()].tablecode!=vars.fieldinfos[$('select#connected',row).val()].tablecode)
			{
				swal('Error!','テーブル内フィールドの指定は同一テーブルにして下さい。','error');
				return;
			}
			settings.push({
				lookup:$('select#lookup',row).val(),
				connected:$('select#connected',row).val()
			});
		}
		/* setup config */
		config['settings']=JSON.stringify(settings);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);