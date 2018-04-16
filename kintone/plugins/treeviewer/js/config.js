/*
*--------------------------------------------------------------------
* jQuery-Plugin "treeviewer -config.js-"
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
								case 'DROP_DOWN':
								case 'RADIO_BUTTON':
									$('select#level').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									break;
								case 'NUMBER':
								case 'SINGLE_LINE_TEXT':
									if (fieldinfo.lookup) $('select#level').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
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
					del:'img.del',
					addcallback:function(row){
						var list=$('select#leveldisplay',row);
						var sort=$('select#levelsort',row);
						var listcontainer=list.closest('.kintoneplugin-select-outer');
						var sortcontainer=sort.closest('.kintoneplugin-select-outer');
						listcontainer.hide();
						sortcontainer.hide();
						$('select#level',row).on('change',function(){
							/* initialize field lists */
							list.html('<option value=""></option>');
							if ($(this).val().length!=0)
							{
								if (vars.fieldinfos[$(this).val()].lookup)
								{
									kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.fieldinfos[$(this).val()].lookup.relatedApp.app},function(resp){
										/* setup field lists */
										$.each(resp.properties,function(key,values){
											switch (values.type)
											{
												case 'SINGLE_LINE_TEXT':
													if (!values.lookup) list.append($('<option>').attr('value',values.code).text(values.label));
											}
										});
										if ($.hasData(list[0]))
											if ($.data(list[0],'initialdata').length!=0)
											{
												list.val($.data(list[0],'initialdata'));
												$.data(list[0],'initialdata','');
											}
										listcontainer.show();
										sortcontainer.show();
									},function(error){});
								}
								else
								{
									listcontainer.hide();
									sortcontainer.hide();
								}
							}
						})
					}
				});
				var add=false;
				var row=null;
				var excludefields=[];
				var excludeviews=[];
				var levels=[];
				if (Object.keys(config).length!==0)
				{
					if (config['windowopen']=='1') $('input#windowopen').prop('checked',true);
					excludefields=JSON.parse(config['excludefield']);
					excludeviews=JSON.parse(config['excludeview']);
					levels=JSON.parse(config['level']);
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
					$.each(levels,function(index){
						if (add) vars.leveltable.addrow();
						else add=true;
						row=vars.leveltable.rows.last();
						$('select#level',row).val(levels[index].code);
						$('select#levelsort',row).val(levels[index].sort);
						/* trigger events */
						$.data($('select#leveldisplay',row)[0],'initialdata',levels[index].display);
						$('select#level',row).trigger('change');
					});
				}
			},function(error){});
		},function(error){});
	});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var excludefields=[];
		var excludeviews=[];
		var levels=[];
		/* check values */
		for (var i=0;i<vars.leveltable.rows.length;i++)
		{
			row=vars.leveltable.rows.eq(i);
			if ($('select#level',row).val().length!=0)
			{
				var level={
					code:$('select#level',row).val(),
					display:'',
					sort:'',
					app:'',
					field:''
				};
				var fieldinfo=vars.fieldinfos[level.code];
				if (fieldinfo.lookup)
				{
					if ($('select#leveldisplay',row).val()=='')
					{
						swal('Error!','表示フィールドを選択して下さい。','error');
						return;
					}
					else
					{
						level.display=$('select#leveldisplay',row).val();
						level.sort=$('select#levelsort',row).val();
						level.app=fieldinfo.lookup.relatedApp.app;
						level.field=fieldinfo.lookup.relatedKeyField;
					}
				}
				levels.push(level);
			}
		}
		if (Object.keys(levels).length==0)
		{
			swal('Error!','階層フィールドを1つ以上指定して下さい。','error');
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
		config['level']=JSON.stringify(levels);
		config['windowopen']=($('input#windowopen').prop('checked'))?'1':'0';
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);