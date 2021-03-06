/*
*--------------------------------------------------------------------
* jQuery-Plugin "ganttchart -config.js-"
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
		colortable:null,
		displaytable:null,
		leveltable:null,
		segmenttable:null,
		fieldinfos:{},
		colors:[
			'#FA8273',
			'#FFF07D',
			'#7DC87D',
			'#69B4C8',
			'#827DB9',
			'#E16EA5',
			'#FA7382',
			'#FFB46E',
			'#B4DC69',
			'#64C3AF',
			'#69A0C8',
			'#B473B4'
		]
	};
	var VIEW_NAME=['月次ガントチャート','年次ガントチャート'];
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
		reloadlevels:function(callback){
			/* clear rows */
			var target=$('select#lookup');
			vars.leveltable.clearrows();
			if (target.val())
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
						$('.segmentsblock').hide();
						$('.levelsblock').show();
						if (callback) callback();
					},function(error){vars.leveltable.container.hide();});
				},function(error){vars.leveltable.container.hide();});
			}
			else
			{
				$('.segmentsblock').show();
				$('.levelsblock').hide();
				if (callback) callback();
			}
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
			vars.fieldinfos=resp.properties;
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'CALC':
						case 'CREATOR':
						case 'DATETIME':
						case 'DROP_DOWN':
						case 'LINK':
						case 'MODIFIER':
						case 'NUMBER':
						case 'RADIO_BUTTON':
						case 'RECORD_NUMBER':
						case 'SINGLE_LINE_TEXT':
						case 'TIME':
							$('select#display').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							if (fieldinfo.lookup)
							{
								$('select#segment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#lookup').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							switch (fieldinfo.type)
							{
								case 'DROP_DOWN':
								case 'RADIO_BUTTON':
									$('select#segment').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
									break;
							}
							break;
						case 'DATE':
							$('select#fromdate').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#todate').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			vars.colortable=$('.segmentcolors').adjustabletable({
				add:'img.add',
				del:'img.del',
				addcallback:function(row){
					$('input#segmentcolor',row).val(vars.colors[0].replace('#',''));
					$('span#segmentcolor',row).colorSelector(vars.colors,$('input#segmentcolor',row));
				}
			});
			vars.displaytable=$('.displays').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			vars.leveltable=$('.levels').adjustabletable({
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
			var displays=[];
			var levels={lookup:'',levels:[]};
			var segments=[];
			var segmentcolors=[];
			if (Object.keys(config).length!==0)
			{
				displays=config['displays'].split(',');
				levels=JSON.parse(config['levels']);
				segments=JSON.parse(config['segment']);
				segmentcolors=config['segmentcolors'].split(',');
				$('select#fromdate').val(config['fromdate']);
				$('select#todate').val(config['todate']);
				$('select#lookup').val(levels.lookup);
				$('input#scalefixedwidth').val(config['scalefixedwidth']);
				if (config['registeredonly']=='1') $('input#registeredonly').prop('checked',true);
				if (config['scalefixed']=='1') $('input#scalefixed').prop('checked',true);
				add=false;
				$.each(displays,function(index){
					if (add) vars.displaytable.addrow();
					else add=true;
					row=vars.displaytable.rows.last();
					$('select#display',row).val(displays[index]);
				});
				add=false;
				$.each(segments,function(key,values){
					if (add) vars.segmenttable.addrow();
					else add=true;
					row=vars.segmenttable.rows.last();
					$('select#segment',row).val(key);
					$('select#segmentsort',row).val(values.sort);
					/* trigger events */
					$.data($('select#segmentdisplay',row)[0],'initialdata',values.display);
					$('select#segment',row).trigger('change');
				});
			}
			else segmentcolors=vars.colors;
			functions.reloadlevels(function(){
				add=false;
				$.each(levels.levels,function(index){
					if (add) vars.leveltable.addrow();
					else add=true;
					row=vars.leveltable.rows.last();
					$('select#level',row).val(levels.levels[index]);
				});
				add=false;
				$.each(segmentcolors,function(index){
					if (add) vars.colortable.addrow();
					else add=true;
					row=vars.colortable.rows.last();
					$('input#segmentcolor',row).val(segmentcolors[index].replace('#',''));
				});
				$.each($('span#segmentcolor'),function(index){
					$(this).colorSelector(vars.colors,$(this).closest('tr').find('input#segmentcolor'));
				});
			});
			$('select#lookup').on('change',function(){functions.reloadlevels()});
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var key='';
		var row=null;
		var fieldinfo={};
		var config=[];
		var displays=[];
		var segments={};
		var segmentcolors=[];
		var levels={
			lookup:'',
			app:'',
			relatedkey:'',
			type:'',
			levels:[]
		};
		/* check values */
		if ($('select#fromdate').val()=='')
		{
			swal('Error!','開始日付フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#todate').val()=='')
		{
			swal('Error!','終了日付フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#fromdate').val()==$('select#todate').val())
		{
			swal('Error!','開始日付フィールドと終了日付フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		for (var i=0;i<vars.displaytable.rows.length;i++)
		{
			row=vars.displaytable.rows.eq(i);
			if ($('select#display',row).val().length!=0) displays.push($('select#display',row).val());
		}
		if (displays.length==0)
		{
			swal('Error!','表示フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#lookup').val()=='')
		{
			for (var i=0;i<vars.segmenttable.rows.length;i++)
			{
				row=vars.segmenttable.rows.eq(i);
				key=$('select#segment',row).val();
				if (key.length!=0)
				{
					segments[key]={display:'',app:'',field:'',sort:''};
					if (vars.fieldinfos[key].lookup)
					{
						if ($('select#segmentdisplay',row).val()=='')
						{
							swal('Error!','区分名フィールドを選択して下さい。','error');
							return;
						}
						else
						{
							segments[key].display=$('select#segmentdisplay',row).val();
							segments[key].app=vars.fieldinfos[key].lookup.relatedApp.app;
							segments[key].field=vars.fieldinfos[key].lookup.relatedKeyField;
							segments[key].sort=$('select#segmentsort',row).val();
						}
					}
				}
			}
			if (Object.keys(segments).length==0)
			{
				swal('Error!','区分は1つ以上指定して下さい。','error');
				return;
			}
		}
		else
		{
			fieldinfo=vars.fieldinfos[$('select#lookup').val()];
			levels.lookup=fieldinfo.code;
			levels.app=fieldinfo.lookup.relatedApp.app;
			levels.relatedkey=fieldinfo.lookup.relatedKeyField;
			levels.type=fieldinfo.type;
			if (fieldinfo.type=='CALC') levels.format=fieldinfo.format;
			else levels.format='';
			for (var i=0;i<vars.leveltable.rows.length;i++)
			{
				row=vars.leveltable.rows.eq(i);
				if ($('select#level',row).val().length!=0) levels.levels.push($('select#level',row).val());
			}
			if (Object.keys(levels.levels).length==0)
			{
				swal('Error!','階層は1つ以上指定して下さい。','error');
				return;
			}
		}
		for (var i=0;i<vars.colortable.rows.length;i++)
		{
			row=vars.colortable.rows.eq(i);
			if ($('input#segmentcolor',row).val().length!=0) segmentcolors.push($('input#segmentcolor',row).val());
		}
		if (segmentcolors.length==0)
		{
			swal('Error!','区分色を1つ以上指定して下さい。','error');
			return;
		}
		if ($('input#scalefixed').prop('checked'))
		{
			if ($('input#scalefixedwidth').val()=='')
			{
				swal('Error!','目盛幅を入力して下さい。','error');
				return;
			}
			if (!$.isNumeric($('input#scalefixedwidth').val()))
			{
				swal('Error!','目盛幅は数値を入力して下さい。','error');
				return;
			}
		}
		/* setup config */
		config['fromdate']=$('select#fromdate').val();
		config['todate']=$('select#todate').val();
		config['displays']=displays.join(',');
		config['levels']=JSON.stringify(levels);
		config['segment']=JSON.stringify(segments);
		config['segmentcolors']=segmentcolors.join(',');
		config['scalefixedwidth']=$('input#scalefixedwidth').val();
		config['registeredonly']=($('input#registeredonly').prop('checked'))?'1':'0';
		config['scalefixed']=($('input#scalefixed').prop('checked'))?'1':'0';
		/* get view lists */
		kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'GET',{app:kintone.app.getId()},function(resp){
			var req=$.extend(true,{},resp);
			req.app=kintone.app.getId();
			$.each(VIEW_NAME,function(index){
				if (!req.views[VIEW_NAME[index]])
				{
					/* swaps the index */
					$.each(req.views,function(key,values){
						if ($.inArray(key,VIEW_NAME)<0) values.index=Number(values.index)+1;
					})
						/* create custom view */
					req.views[VIEW_NAME[index]]={
						type:'CUSTOM',
						name:VIEW_NAME[index],
						html:'<div id="ganttchart-container" class="customview-container"></div>',
						filterCond:'',
						sort:'',
						pager:false,
						index:index
					};
				}
			});
			/* save viewid */
			kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'PUT',req,function(resp){
				/* setup config */
				config['monthganttchart']=resp.views[VIEW_NAME[0]].id;
				config['yearganttchart']=resp.views[VIEW_NAME[1]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){swal('Error!',error.message,'error');});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);