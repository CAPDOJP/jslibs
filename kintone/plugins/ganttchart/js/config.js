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
		segmenttable:null,
		appIds:{},
		appFields:{},
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
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		$.each(resp.properties,function(key,values){
			/* check field type */
			switch (values.type)
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
					$('select#display').append($('<option>').attr('value',values.code).text(values.label));
					if (values.lookup)
					{
						$('select#segment').append($('<option>').attr('value',values.code).text(values.label));
						vars.appIds[values.code]=values.lookup.relatedApp.app;
						vars.appFields[values.code]=values.lookup.relatedKeyField;
					}
					switch (values.type)
					{
						case 'DROP_DOWN':
							$('select#segment').append($('<option>').attr('value',values.code).text(values.label));
							break;
						case 'RADIO_BUTTON':
							$('select#segment').append($('<option>').attr('value',values.code).text(values.label));
							break;
					}
					break;
				case 'DATE':
					$('select#fromdate').append($('<option>').attr('value',values.code).text(values.label));
					$('select#todate').append($('<option>').attr('value',values.code).text(values.label));
					break;
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
		vars.segmenttable=$('.segments').adjustabletable({
			add:'img.add',
			del:'img.del',
			addcallback:function(row){
				var list=$('select#segmentdisplay',row);
				var listcontainer=list.closest('.kintoneplugin-select-outer');
				listcontainer.hide();
				$('select#segment',row).on('change',function(){
					/* initialize field lists */
					list.html('<option value=""></option>');
					if ($(this).val().length!=0)
					{
						if ($(this).val() in vars.appIds)
						{
							kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:vars.appIds[$(this).val()]},function(resp){
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
							},function(error){});
						}
						else listcontainer.hide();
					}
				})
			}
		});
		var add=false;
		var row=null;
		var segments=[];
		var segmentcolors=[];
		if (Object.keys(config).length!==0)
		{
			segments=JSON.parse(config['segment']);
			segmentcolors=config['segmentcolors'].split(',');
			$('select#fromdate').val(config['fromdate']);
			$('select#todate').val(config['todate']);
			$('select#display').val(config['display']);
			$('input#scalefixedwidth').val(config['scalefixedwidth']);
			if (config['scalefixed']=='1') $('input#scalefixed').prop('checked',true);
			$.each(segments,function(key,values){
				if (add) vars.segmenttable.addrow();
				else add=true;
				row=vars.segmenttable.rows.last();
				$('select#segment',row).val(key);
				/* trigger events */
				$.data($('select#segmentdisplay',row)[0],'initialdata',values.display);
				$('select#segment',row).trigger('change');
			});
		}
		else segmentcolors=vars.colors;
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
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var key='';
		var row=null;
		var config=[];
		var segments={};
		var segmentcolors=[];
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
		if ($('select#display').val()=='')
		{
			swal('Error!','表示フィールドを選択して下さい。','error');
			return;
		}
		if ($('select#fromdate').val()==$('select#todate').val())
		{
			swal('Error!','開始日付フィールドと終了日付フィールドは異なるフィールドを選択して下さい。','error');
			return;
		}
		for (var i=0;i<vars.segmenttable.rows.length;i++)
		{
			row=vars.segmenttable.rows.eq(i);
			key=$('select#segment',row).val();
			if (key.length!=0)
			{
				segments[key]={display:'',app:'',field:''};
				if (key in vars.appIds)
				{
					if ($('select#segmentdisplay',row).val()=='')
					{
						swal('Error!','区分名フィールドを選択して下さい。','error');
						return;
					}
					else
					{
						segments[key].display=$('select#segmentdisplay',row).val();
						segments[key].app=vars.appIds[key];
						segments[key].field=vars.appFields[key];
					}
				}
			}
		}
		if (Object.keys(segments).length==0)
		{
			swal('Error!','区分を1つ以上指定して下さい。','error');
			return;
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
		config['display']=$('select#display').val();
		config['segment']=JSON.stringify(segments);
		config['segmentcolors']=segmentcolors.join(',');
		config['scalefixedwidth']=$('input#scalefixedwidth').val();
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
		},function(error){});
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);