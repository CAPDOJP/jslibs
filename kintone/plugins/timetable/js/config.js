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
				case 'DATETIME':
				case 'DROP_DOWN':
				case 'LINK':
				case 'MODIFIER':
				case 'NUMBER':
				case 'RADIO_BUTTON':
				case 'RECORD_NUMBER':
				case 'SINGLE_LINE_TEXT':
					$('select#display').append($('<option>').attr('value',values.code).text(values.label));
					if (values.lookup)
					{
						$('select#segment').append($('<option>').attr('value',values.code).text(values.label));
						vars.appIds[values.code]=values.lookup.relatedApp.app;
						vars.appFields[values.code]=values.lookup.relatedKeyField;
					}
					if (values.type=='NUMBER')
					{
						/* exclude lookup */
						if (!values.lookup)
						{
							/* check scale */
							if (values.displayScale)
								if (values.displayScale>8)
								{
									$('select#lat').append($('<option>').attr('value',values.code).text(values.label));
									$('select#lng').append($('<option>').attr('value',values.code).text(values.label));
								}
						}
					}
					break;
				case 'DATE':
					$('select#date').append($('<option>').attr('value',values.code).text(values.label));
					break;
				case 'TIME':
					$('select#fromtime').append($('<option>').attr('value',values.code).text(values.label));
					$('select#totime').append($('<option>').attr('value',values.code).text(values.label));
					break;
			}
		});
		/* initialize valiable */
		vars.colortable=new AdjustTable({
			table:$('.colors'),
			add:'img.add',
			del:'img.del',
			addcallback:function(row){
				$('input#segmentcolor',row).val(vars.colors[0].replace('#',''));
				$('span#segmentcolor',row).colorSelector(vars.colors,$('input#segmentcolor',row));
			}
		});
		/* lists action */
		$('select#segment').on('change',function(){
			var list=$('select#segmentdisplay');
			/* initialize field lists */
			list.html('<option value=""></option>');
			if ($(this).val().length!=0)
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
				},function(error){});
			}
		})
		var add=false;
		var row=null;
		var colors=[];
        if (Object.keys(config).length!==0)
        {
			colors=config['segmentcolors'].split(',');
        	$('select#date').val(config['date']);
        	$('select#fromtime').val(config['fromtime']);
        	$('select#totime').val(config['totime']);
        	$('select#display').val(config['display']);
        	$('select#segment').val(config['segment']);
        	$('select#scale').val(config['scale']);
        	$('select#starthour').val(config['starthour']);
        	$('select#endhour').val(config['endhour']);
        	$('select#lat').val(config['lat']);
        	$('select#lng').val(config['lng']);
        	$('input#scalefixedwidth').val(config['scalefixedwidth']);
        	$('input#apikey').val(config['apikey']);
        	if (config['scalefixed']=='1') $('input#scalefixed').prop('checked',true);
        	if (config['route']=='1') $('input#route').prop('checked',true);
	    	/* trigger events */
        	$.data($('select#segmentdisplay')[0],'initialdata',config['segmentdisplay']);
        	$('select#segment').trigger('change');
        }
        else colors=vars.colors;
		$.each(colors,function(index){
			if (add) vars.colortable.addrow();
			else add=true;
			row=vars.colortable.rows.last();
			$('input#segmentcolor',row).val(colors[index].replace('#',''));
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
		var colors=[];
        var config=[];
	    /* check values */
	    if ($('select#date').val()=='')
	    {
	    	swal('Error!','日付フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#fromtime').val()=='')
	    {
	    	swal('Error!','開始時刻フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#totime').val()=='')
	    {
	    	swal('Error!','終了時刻フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#display').val()=='')
	    {
	    	swal('Error!','表示フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#fromtime').val()==$('select#totime').val())
	    {
	    	swal('Error!','開始時刻フィールドと終了時刻フィールドは異なるフィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#segment').val()!='')
	    {
		    if ($('select#segmentdisplay').val()=='')
		    {
		    	swal('Error!','区分名フィールドを選択して下さい。','error');
		    	return;
		    }
	    }
		for (var i=0;i<vars.colortable.rows.length;i++)
		{
			row=vars.colortable.rows.eq(i);
		    if ($('input#segmentcolor',row).val().length!=0) colors.push($('input#segmentcolor',row).val());
		}
		if (colors.length==0)
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
	    if ($('select#endhour').val()=='')
	    {
	    	swal('Error!','タイムテーブル設定終了時刻を選択して下さい。','error');
	    	return;
	    }
	    if ($('input#route').prop('checked'))
	    {
		    if ($('select#lat').val()=='')
		    {
		    	swal('Error!','緯度表示フィールドを選択して下さい。','error');
		    	return;
		    }
		    if ($('select#lng').val()=='')
		    {
		    	swal('Error!','経度表示フィールドを選択して下さい。','error');
		    	return;
		    }
		    if ($('input#apikey').val()=='')
		    {
		    	swal('Error!','Google Maps APIキーを入力して下さい。','error');
		    	return;
		    }
		    if ($('select#lat').val()==$('select#lng').val())
		    {
		    	swal('Error!','緯度表示フィールドと経度表示フィールドは異なるフィールドを選択して下さい。','error');
		    	return;
		    }
	    }
		/* setup config */
        config['date']=$('select#date').val();
        config['fromtime']=$('select#fromtime').val();
        config['totime']=$('select#totime').val();
        config['display']=$('select#display').val();
        config['segment']=$('select#segment').val();
        config['segmentdisplay']=$('select#segmentdisplay').val();
        config['segmentcolors']=colors.join(',');
        config['scale']=$('select#scale').val();
        config['starthour']=$('select#starthour').val();
        config['endhour']=$('select#endhour').val();
        if ($('select#segment').val().length!=0)
        {
		    config['segmentapp']=vars.appIds[$('select#segment').val()];
		    config['segmentappfield']=vars.appFields[$('select#segment').val()];
        }
        else
        {
		    config['segmentapp']='';
		    config['segmentappfield']='';
        }
        config['lat']=$('select#lat').val();
        config['lng']=$('select#lng').val();
        config['scalefixedwidth']=$('input#scalefixedwidth').val();
        config['apikey']=$('input#apikey').val();
        config['scalefixed']=($('input#scalefixed').prop('checked'))?'1':'0';
        config['route']=($('input#route').prop('checked'))?'1':'0';
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