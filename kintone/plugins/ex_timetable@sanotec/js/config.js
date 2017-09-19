/*
*--------------------------------------------------------------------
* jQuery-Plugin "timetable -config.js-"
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
	var VIEW_NAME=['日次タイムテーブル','週次タイムテーブル','月次予定表'];
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
				case 'DROP_DOWN':
				case 'LINK':
				case 'MODIFIER':
				case 'NUMBER':
				case 'RADIO_BUTTON':
				case 'RECORD_NUMBER':
				case 'SINGLE_LINE_TEXT':
					$('select#display').append($('<option>').attr('value',values.code).text(values.label));
					$('select#tooltip').append($('<option>').attr('value',values.code).text(values.label));
					if (!values.lookup) $('select#segment').append($('<option>').attr('value',values.code).text(values.label));
					break;
				case 'DATETIME':
					$('select#fromtime').append($('<option>').attr('value',values.code).text(values.label));
					$('select#totime').append($('<option>').attr('value',values.code).text(values.label));
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
        	$('select#fromtime').val(config['fromtime']);
        	$('select#totime').val(config['totime']);
        	$('select#display').val(config['display']);
        	$('select#tooltip').val(config['tooltip']);
        	$('select#segment').val(config['segment']);
        	$('select#scale').val(config['scale']);
        	$('select#starthour').val(config['starthour']);
        	$('input#scalefixedwidth').val(config['scalefixedwidth']);
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
		var row=null;
        var config=[];
		var segments=[];
		var segmentcolors=[];
	    /* check values */
	    if ($('select#fromtime').val()=='')
	    {
	    	swal('Error!','開始日時フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#totime').val()=='')
	    {
	    	swal('Error!','終了日時フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#display').val()=='')
	    {
	    	swal('Error!','表示フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#tooltip').val()=='')
	    {
	    	swal('Error!','ツールチップフィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#fromtime').val()==$('select#totime').val())
	    {
	    	swal('Error!','開始日時フィールドと終了日時フィールドは異なるフィールドを選択して下さい。','error');
	    	return;
	    }
		for (var i=0;i<vars.segmenttable.rows.length;i++)
		{
			row=vars.segmenttable.rows.eq(i);
			if ($('select#segment',row).val().length!=0) segments.push($('select#segment',row).val());
		}
		if (segments.length==0)
		{
			swal('Error!','区分を指定して下さい。','error');
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
	    if ($('select#scale').val()=='')
	    {
	    	swal('Error!','目盛り間隔を選択して下さい。','error');
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
	    if ($('select#starthour').val()=='')
	    {
	    	swal('Error!','タイムテーブル設定開始時刻を選択して下さい。','error');
	    	return;
	    }
		/* setup config */
        config['fromtime']=$('select#fromtime').val();
        config['totime']=$('select#totime').val();
        config['display']=$('select#display').val();
        config['tooltip']=$('select#tooltip').val();
        config['segment']=segments.join(',');
        config['segmentcolors']=segmentcolors.join(',');
        config['scale']=$('select#scale').val();
        config['starthour']=$('select#starthour').val();
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
						html:'<div id="timetable-container" class="customview-container"></div>',
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
		        config['datetimetable']=resp.views[VIEW_NAME[0]].id;
		        config['weektimetable']=resp.views[VIEW_NAME[1]].id;
		        config['monthtimetable']=resp.views[VIEW_NAME[2]].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
    $('button#cancel').on('click',function(e){
        history.back();
    });
})(jQuery,kintone.$PLUGIN_ID);