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
		colorrows:null,
		colortemplate:null
	};
	var functions={
		addcolor:function(){
			var row=null;
			$('.colors').append(vars.colortemplate.clone(true));
			/* initialize valiable */
			vars.colorrows=$('.colors').find('tr');
			/* events */
			row=vars.colorrows.last();
			$('img.add',row).on('click',function(){functions.addcolor()});
			$('img.del',row).on('click',function(){functions.delcolor($(this).closest('tr'))});
			$('input#datespancolor',row).val(vars.colors[0].replace('#',''));
			$('span#datespancolor',row).colorSelector(vars.colors,$('input#datespancolor',row));
		},
		delcolor:function(row){
			row.remove();
			/* initialize valiable */
			vars.colorrows=$('.colors').find('tr');
		},
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/form',true),'GET',{app:kintone.app.getId()},function(resp){
        var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		/* initialize valiable */
		vars.colorrows=$('.colors').find('tr');
		vars.colortemplate=vars.colorrows.first().clone(true);
		/* setup colorfields lists */
		vars.colors=[];
		$.each($.markercolors(),function(index,values){vars.colors.push('#'+values.back);});
		/* create colorfields rows */
		if (vars.colorrows!=null) vars.colorrows.remove();
		functions.addcolor();
		$('img.del',vars.colorrows.first()).css({'display':'none'});
		$.each(resp.properties,function(index,values){
			/* check field type */
			switch (values.type)
			{
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
        if (Object.keys(config).length!==0)
        {
        	$('select#address').val(config['address']);
        	$('select#pluscode').val(config['pluscode']);
        	$('select#lat').val(config['lat']);
        	$('select#lng').val(config['lng']);
        	$('select#spacer').val(config['spacer']);
        	$('select#information').val(config['information']);
        	$('select#datespan').val(config['datespan']);
        	$('input#defaultcolor').val(config['defaultcolor']);
			var add=false;
			var colors=JSON.parse(config['datespancolors']);
			$.each(colors,function(key,values){
				if (add) functions.addcolor();
				else add=true;
				var row=vars.colorrows.last();
				$('input#datespanday',row).val(key);
				$('input#datespancolor',row).val(values);
			});
        	$('input#markersize').val(config['markersize']);
        	$('input#markerfont').val(config['markerfont']);
        	$('input#chasetimespan').val(config['chasetimespan']);
        	$('input#apikey').val(config['apikey']);
        	if (config['map']=='1') $('input#map').prop('checked',true);
        	if (config['chasemode']=='1') $('input#chasemode').prop('checked',true);
        }
        else
        {
        	$('input#markersize').val('34');
        	$('input#markerfont').val('11');
        	$('input#chasetimespan').val('10');
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
		var colors={};
        var config=[];
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
	    if ($('select#lat').val()==$('select#lng').val())
	    {
	    	swal('Error!','緯度表示フィールドと経度表示フィールドは異なるフィールドを選択して下さい。','error');
	    	return;
	    }
	    if ($('input#map').prop('checked'))
	    {
		    if ($('input#defaultcolor').val()=='')
		    {
		    	swal('Error!','マーカー規定色を選択して下さい。','error');
		    	return;
		    }
			for (var i=0;i<vars.colorrows.length;i++)
			{
				var row=vars.colorrows.eq(i);
				if ($('input#datespanday',row).val().length!=0)
				{
				    if ($('input#datespancolor',row).val()=='')
				    {
				    	swal('Error!','マーカー色を選択して下さい。','error');
				    	error=true;
				    }
					colors[$('input#datespanday',row).val().toString()]=$('input#datespancolor',row).val();
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
	    }
	    if (error) return;
	    if ($('input#chasemode').prop('checked'))
	    {
		    if ($('input#chasetimespan').val()=='') $('input#chasetimespan').val('10');
			if (!$.isNumeric($('input#chasetimespan').val()))
		    {
		    	swal('Error!','更新間隔は数値を入力して下さい。','error');
		    	return;
		    }
	    }
		/* setup config */
        config['address']=$('select#address').val();
        config['pluscode']=$('select#pluscode').val();
        config['lat']=$('select#lat').val();
        config['lng']=$('select#lng').val();
        config['spacer']=$('select#spacer').val();
        config['map']=($('input#map').prop('checked'))?'1':'0';
        config['information']=$('select#information').val();
        config['datespan']=$('select#datespan').val();
        config['defaultcolor']=$('input#defaultcolor').val();
		config['datespancolors']=JSON.stringify(colors);
        config['markersize']=$('input#markersize').val();
        config['markerfont']=$('input#markerfont').val();
        config['chasemode']=($('input#chasemode').prop('checked'))?'1':'0';
        config['chasetimespan']=$('input#chasetimespan').val();
        config['apikey']=$('input#apikey').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
    $('button#cancel').on('click',function(e){
        history.back();
    });
})(jQuery,kintone.$PLUGIN_ID);