/*
*--------------------------------------------------------------------
* jQuery-Plugin "lookupviewer -config.js-"
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
		excludefieldtable:null,
		excludeviewtable:null,
		leveltable:null,
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
		},
		reloadlevels:function(callback){
			/* clear rows */
			var target=$('select#lookup');
			vars.leveltable.clearrows();
			if (target.val().length!=0)
			{
				var fieldinfo=vars.fieldinfos[target.val()];
				kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:fieldinfo.lookup.relatedApp.app},function(resp){
					var sorted=functions.fieldsort(resp.layout);
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:fieldinfo.lookup.relatedApp.app},function(resp){
						var list=null;
						list=$('select#level',vars.leveltable.template);
						list.html('<option value=""></option>');
						$.each(sorted,function(index){
							if (sorted[index] in resp.properties)
							{
								fieldinfo=resp.properties[sorted[index]];
								/* check field type */
								switch (fieldinfo.type)
								{
									case 'CATEGORY':
									case 'CREATED_TIME':
									case 'FILE':
									case 'RECORD_NUMBER':
									case 'REFERENCE_TABLE':
									case 'STATUS':
									case 'STATUS_ASSIGNEE':
									case 'UPDATED_TIME':
										break;
									default:
										list.append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								}
							}
						});
						vars.leveltable.addrow();
						vars.leveltable.container.show();
						if (callback) callback();
					},function(error){vars.leveltable.container.hide();});
				},function(error){vars.leveltable.container.hide();});
			}
			else vars.leveltable.container.hide();
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
						/* check field type */
						if (fieldinfo.tablecode.length!=0) $('select#excludefield').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
						else
						{
							switch (fieldinfo.type)
							{
								case 'NUMBER':
								case 'SINGLE_LINE_TEXT':
									if (fieldinfo.lookup) $('select#lookup').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									break;
							}
						}
					}
				});
				/* initialize valiable */
				vars.excludefieldtable=$('.excludefields').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				vars.excludeviewtable=$('.excludeviews').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				vars.leveltable=$('.levels').adjustabletable({
					add:'img.add',
					del:'img.del'
				});
				var add=false;
				var row=null;
				var excludefields=[];
				var excludeviews=[];
				var settings={};
				if (Object.keys(config).length!==0)
				{
					settings=JSON.parse(config['settings']);
					$('select#lookup').val(settings.lookup);
				}
				functions.reloadlevels(function(){
					if (Object.keys(config).length!==0)
					{
						if (config['windowopen']=='1') $('input#windowopen').prop('checked',true);
						excludefields=JSON.parse(config['excludefield']);
						excludeviews=JSON.parse(config['excludeview']);
						add=false;
						$.each(excludefields,function(index){
							if (add) vars.excludefieldtable.addrow();
							else add=true;
							row=vars.excludefieldtable.rows.last();
							$('select#excludefield',row).val(excludefields[index]);
						});
						add=false;
						$.each(excludeviews,function(index){
							if (add) vars.excludeviewtable.addrow();
							else add=true;
							row=vars.excludeviewtable.rows.last();
							$('select#excludeview',row).val(excludeviews[index]);
						});
						add=false;
						$.each(settings.levels,function(index){
							if (add) vars.leveltable.addrow();
							else add=true;
							row=vars.leveltable.rows.last();
							$('select#level',row).val(settings.levels[index]);
						});
					}
				});
				$('select#lookup').on('change',function(){functions.reloadlevels()});
			},function(error){});
		},function(error){});
	},function(error){swal('Error!',error.message,'error');});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var fieldinfo=null;
		var row=null;
		var config=[];
		var excludefields=[];
		var excludeviews=[];
		var settings={
			lookup:'',
			app:'',
			relatedkey:'',
			sort:'',
			type:'',
			levels:[]
		};
		/* check values */
		if ($('select#lookup').val()=='')
		{
			swal('Error!','階層設定フィールドを選択して下さい。','error');
			return;
		}
		else
		{
			fieldinfo=vars.fieldinfos[$('select#lookup').val()];
			settings.lookup=fieldinfo.code;
			settings.app=fieldinfo.lookup.relatedApp.app;
			settings.relatedkey=fieldinfo.lookup.relatedKeyField;
			settings.sort=fieldinfo.lookup.sort;
			settings.type=fieldinfo.type;
			if (fieldinfo.type=='CALC') settings.format=fieldinfo.format;
			else settings.format='';
		}
		for (var i=0;i<vars.leveltable.rows.length;i++)
		{
			row=vars.leveltable.rows.eq(i);
			if ($('select#level',row).val().length!=0) settings.levels.push($('select#level',row).val());
		}
		if (Object.keys(settings.levels).length==0)
		{
			swal('Error!','階層は1つ以上指定して下さい。','error');
			return;
		}
		for (var i=0;i<vars.excludeviewtable.rows.length;i++)
		{
			row=vars.excludeviewtable.rows.eq(i);
			if ($('select#excludeview',row).val().length!=0) excludeviews.push($('select#excludeview',row).val());
		}
		for (var i=0;i<vars.excludefieldtable.rows.length;i++)
		{
			row=vars.excludefieldtable.rows.eq(i);
			if ($('select#excludefield',row).val().length!=0) excludefields.push($('select#excludefield',row).val());
		}
		/* setup config */
		config['excludefield']=JSON.stringify(excludefields);
		config['excludeview']=JSON.stringify(excludeviews);
		config['settings']=JSON.stringify(settings);
		config['windowopen']=($('input#windowopen').prop('checked'))?'1':'0';
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);