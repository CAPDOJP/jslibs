/*
*--------------------------------------------------------------------
* jQuery-Plugin "geocoding -config.js-"
* Version: 1.0
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
		colors:null,
		colortable:null
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/form',true),'GET',{app:kintone.app.getId()},function(resp){
        var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		/* setup colorfields lists */
		vars.colors=[];
		$.each($.markercolors(),function(index,values){vars.colors.push('#'+values.back);});
		$.each(resp.properties,function(index,values){
			/* check field type */
			switch (values.type)
			{
				case 'CHECK_BOX':
					$('select#remove').append($('<option>').attr('value',values.code).text(values.label));
					break;
				case 'DATE':
					$('select#datespan').append($('<option>').attr('value',values.code).text(values.label));
					break;
				case 'NUMBER':
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
					break;
				case 'SINGLE_LINE_TEXT':
					/* exclude lookup */
					if (!values.lookup)
					{
						$('select#address').append($('<option>').attr('value',values.code).text(values.label));
						$('select#pluscode').append($('<option>').attr('value',values.code).text(values.label));
						$('select#information').append($('<option>').attr('value',values.code).text(values.label));
					}
					break;
				case 'SPACER':
					$('select#spacer').append($('<option>').attr('value',values.elementId).text(values.elementId));
					break;
			}
		});
		/* initialize valiable */
		vars.colortable=$('.colors').adjustabletable({
			add:'img.add',
			del:'img.del',
			addcallback:function(row){
				$('input#datespancolor',row).val(vars.colors[0].replace('#',''));
				$('span#datespancolor',row).colorSelector(vars.colors,$('input#datespancolor',row));
			}
		});
        if (Object.keys(config).length!==0)
        {
        	$('select#address').val(config['address']);
        	$('select#pluscode').val(config['pluscode']);
        	$('select#lat').val(config['lat']);
        	$('select#lng').val(config['lng']);
        	$('select#spacer').val(config['spacer']);
        	$('select#information').val(config['information']);
        	$('select#remove').val(config['remove']);
        	$('select#datespan').val(config['datespan']);
        	$('input#defaultcolor').val(config['defaultcolor']);
			var add=false;
			var datespancolors=JSON.parse(config['datespancolors']);
			$.each(datespancolors,function(key,values){
				if (add) vars.colortable.addrow();
				else add=true;
				var row=vars.colortable.rows.last();
				$('input#datespanday',row).val(key);
				$('input#datespancolor',row).val(values);
			});
        	$('input#markersize').val(config['markersize']);
        	$('input#markerfont').val(config['markerfont']);
        	$('input#apikey').val(config['apikey']);
        	if (config['chasemode']=='1') $('input#chasemode').prop('checked',true);
        }
        else
        {
        	$('input#markersize').val('34');
        	$('input#markerfont').val('11');
        	$('input#defaultcolor').val(vars.colors[0].replace('#',''));
			$.each($('input#datespancolor'),function(){$(this).val(vars.colors[0].replace('#',''))});
        }
		$('span#defaultcolor').colorSelector(vars.colors,$('input#defaultcolor'));
		$.each($('span#datespancolor'),function(index){
			$(this).colorSelector(vars.colors,$(this).closest('tr').find('input#datespancolor'));
		});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
        var config=[];
		var datespancolors={};
	    /* check values */
	    if ($('select#address').val()=='')
	    {
	    	swal('Error!','住所入力フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#pluscode').val()=='')
	    {
	    	swal('Error!','Plusコード入力フィールドを選択して下さい。','error');
	    	return;
	    }
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
	    if ($('select#spacer').val()=='')
	    {
	    	swal('Error!','地図表示フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#information').val()=='')
	    {
	    	swal('Error!','表示フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#remove').val()=='')
	    {
	    	swal('Error!','一時撤去フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#datespan').val()=='')
	    {
	    	swal('Error!','経過日数算出フィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('select#lat').val()==$('select#lng').val())
	    {
	    	swal('Error!','緯度表示フィールドと経度表示フィールドは異なるフィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('input#defaultcolor').val()=='')
	    {
	    	swal('Error!','マーカー規定色を選択して下さい。','error');
	    	return;
	    }
		for (var i=0;i<vars.colortable.rows.length;i++)
		{
			var row=vars.colortable.rows.eq(i);
			if ($('input#datespanday',row).val().length!=0)
			{
			    if ($('input#datespancolor',row).val()=='')
			    {
			    	swal('Error!','マーカー色を選択して下さい。','error');
			    	error=true;
			    }
				datespancolors[$('input#datespanday',row).val().toString()]=$('input#datespancolor',row).val();
			}
		}
	    if ($('input#markersize').val()=='') $('input#markersize').val('34');
		if (!$.isNumeric($('input#markersize').val()))
	    {
	    	swal('Error!','マーカーサイズは数値を入力して下さい。','error');
	    	return;
	    }
	    if ($('input#markerfont').val()=='') $('input#markerfont').val('11');
		if (!$.isNumeric($('input#markerfont').val()))
	    {
	    	swal('Error!','マーカーフォントサイズは数値を入力して下さい。','error');
	    	return;
	    }
	    if ($('input#apikey').val()=='')
	    {
	    	swal('Error!','Google Maps APIキーを入力して下さい。','error');
	    	return;
	    }
	    if (error) return;
		/* setup config */
        config['app']=kintone.app.getId().toString();
        config['address']=$('select#address').val();
        config['pluscode']=$('select#pluscode').val();
        config['lat']=$('select#lat').val();
        config['lng']=$('select#lng').val();
        config['spacer']=$('select#spacer').val();
        config['information']=$('select#information').val();
        config['remove']=$('select#remove').val();
        config['datespan']=$('select#datespan').val();
        config['defaultcolor']=$('input#defaultcolor').val();
		config['datespancolors']=JSON.stringify(datespancolors);
        config['markersize']=$('input#markersize').val();
        config['markerfont']=$('input#markerfont').val();
        config['chasemode']=($('input#chasemode').prop('checked'))?'1':'0';
        config['apikey']=$('input#apikey').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
    $('button#cancel').on('click',function(e){
        history.back();
    });
})(jQuery,kintone.$PLUGIN_ID);