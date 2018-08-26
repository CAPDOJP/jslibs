/*
*--------------------------------------------------------------------
* jQuery-Plugin "listviewer -config.js-"
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
		fieldtable:null,
		viewtable:null,
		fieldinfos:{}
	};
	var functions={
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
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
	kintone.api(kintone.api.url('/k/v1/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
		$.each(resp.views,function(key,values){
			$('select#excludeview').append($('<option>').attr('value',values.id).text(key));
		});
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
						$('select#excludefield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					}
				});
				vars.fieldtable=$('.excludefields').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				vars.viewtable=$('.excludeviews').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				var add=false;
				var row=null;
				var fields=[];
				var views=[];
				if (Object.keys(config).length!==0)
				{
					fields=config['excludefield'].split(',');
					views=config['excludeview'].split(',');
					add=false;
					$.each(fields,function(index){
						if (add) vars.fieldtable.addrow();
						else add=true;
						row=vars.fieldtable.rows.last();
						$('select#excludefield',row).val(fields[index]);
					});
					add=false;
					$.each(views,function(index){
						if (add) vars.viewtable.addrow();
						else add=true;
						row=vars.viewtable.rows.last();
						$('select#excludeview',row).val(views[index]);
					});
				}
			},function(error){});
		},function(error){});
	},function(error){swal('Error!',error.message,'error');});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var fields=[];
		var views=[];
		/* check values */
		for (var i=0;i<vars.viewtable.rows.length;i++)
		{
			row=vars.viewtable.rows.eq(i);
			if ($('select#excludeview',row).val().length!=0) views.push($('select#excludeview',row).val());
		}
		for (var i=0;i<vars.fieldtable.rows.length;i++)
		{
			row=vars.fieldtable.rows.eq(i);
			if ($('select#excludefield',row).val().length!=0) fields.push($('select#excludefield',row).val());
		}
		/* setup config */
		config['excludeview']=views.join(',');
		config['excludefield']=fields.join(',');
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);