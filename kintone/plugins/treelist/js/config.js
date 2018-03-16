/*
*--------------------------------------------------------------------
* jQuery-Plugin "treelist -config.js-"
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
		segmenttable:null,
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
									$('select#segment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									break;
								case 'NUMBER':
								case 'SINGLE_LINE_TEXT':
									if (fieldinfo.lookup) $('select#segment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
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
				vars.segmenttable=$('.segments').adjustabletable({
					add:'img.add',
					del:'img.del',
					addcallback:function(row){
						var list=$('select#segmentdisplay',row);
						var sort=$('select#segmentsort',row);
						var listcontainer=list.closest('.kintoneplugin-select-outer');
						var sortcontainer=sort.closest('.kintoneplugin-select-outer');
						listcontainer.hide();
						sortcontainer.hide();
						$('select#segment',row).on('change',function(){
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
				var segments=[];
				if (Object.keys(config).length!==0)
				{
					excludefields=JSON.parse(config['excludefield']);
					excludeviews=JSON.parse(config['excludeview']);
					segments=JSON.parse(config['segment']);
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
					$.each(segments,function(index){
						if (add) vars.segmenttable.addrow();
						else add=true;
						row=vars.segmenttable.rows.last();
						$('select#segment',row).val(segments[index].code);
						$('select#segmentsort',row).val(segments[index].sort);
						/* trigger events */
						$.data($('select#segmentdisplay',row)[0],'initialdata',segments[index].display);
						$('select#segment',row).trigger('change');
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
		var segments=[];
		/* check values */
		for (var i=0;i<vars.segmenttable.rows.length;i++)
		{
			row=vars.segmenttable.rows.eq(i);
			if ($('select#segment',row).val().length!=0)
			{
				var segment={
					code:$('select#segment',row).val(),
					display:'',
					sort:'',
					app:'',
					field:''
				};
				var fieldinfo=vars.fieldinfos[segment.code];
				if (fieldinfo.lookup)
				{
					if ($('select#segmentdisplay',row).val()=='')
					{
						swal('Error!','表示フィールドを選択して下さい。','error');
						return;
					}
					else
					{
						segment.display=$('select#segmentdisplay',row).val();
						segment.sort=$('select#segmentsort',row).val();
						segment.app=fieldinfo.lookup.relatedApp.app;
						segment.field=fieldinfo.lookup.relatedKeyField;
					}
				}
				segments.push(segment);
			}
		}
		if (Object.keys(segments).length==0)
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
		config['segment']=JSON.stringify(segments);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);