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
				case 'DATE':
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
					$('select#segment').append($('<option>').attr('value',values.code).text(values.label));
					switch (values.type)
					{
						case 'DATE':
							$('select#fromdate').append($('<option>').attr('value',values.code).text(values.label));
							$('select#todate').append($('<option>').attr('value',values.code).text(values.label));
							break;
					}
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
			del:'img.del'
		});
		var add=false;
		var row=null;
		var segments=[];
		var segmentcolors=[];
		if (Object.keys(config).length!==0)
		{
			segments=config['segment'].split(',');
			segmentcolors=config['segmentcolors'].split(',');
			$('select#fromdate').val(config['fromdate']);
			$('select#todate').val(config['todate']);
			$('select#display').val(config['display']);
			$('input#scalefixedwidth').val(config['scalefixedwidth']);
			$('input#license').val(config['license']);
			if (config['scalefixed']=='1') $('input#scalefixed').prop('checked',true);
			$.each(segments,function(index){
				if (add) vars.segmenttable.addrow();
				else add=true;
				row=vars.segmenttable.rows.last();
				$('select#segment',row).val(segments[index]);
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
		var segments=[];
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
			if ($('select#segment',row).val().length!=0) segments.push($('select#segment',row).val());
		}
		if (segments.length==0)
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
		if ($('input#license').val().length==0)
		{
			swal('Error!','ライセンス認証URLを入力して下さい。','error');
			return;
		}
		/* setup config */
		config['fromdate']=$('select#fromdate').val();
		config['todate']=$('select#todate').val();
		config['display']=$('select#display').val();
        config['segment']=segments.join(',');
		config['segmentcolors']=segmentcolors.join(',');
		config['scalefixedwidth']=$('input#scalefixedwidth').val();
		config['scalefixed']=($('input#scalefixed').prop('checked'))?'1':'0';
		config['license']=$('input#license').val();
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