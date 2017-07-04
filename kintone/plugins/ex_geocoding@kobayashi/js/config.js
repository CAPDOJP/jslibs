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
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/form',true),'GET',{app:kintone.app.getId()},function(resp){
        var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		$.each(resp.properties,function(index,values){
			/* check field type */
			switch (values.type)
			{
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
						$('select#information').append($('<option>').attr('value',values.code).text(values.label));
					}
					break;
				case 'SPACER':
					$('select#spacer').append($('<option>').attr('value',values.elementId).text(values.elementId));
					break;
			}
	        if (Object.keys(config).length!==0)
	        {
	        	$('select#address').val(config['address']);
	        	$('select#lat').val(config['lat']);
	        	$('select#lng').val(config['lng']);
	        	$('select#spacer').val(config['spacer']);
	        	$('input#mapheight').val(config['mapheight']);
	        	$('select#information').val(config['information']);
	        	$('input#chasetimespan').val(config['chasetimespan']);
	        	$('input#apikey').val(config['apikey']);
	        	if (config['map']=='1') $('input#map').prop('checked',true);
	        	if (config['chasemode']=='1') $('input#chasemode').prop('checked',true);
	        }
	        else
	        {
	        	$('input#mapheight').val('50');
	        	$('input#chasetimespan').val('10');
	        }
		});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
        var config=[];
	    /* check values */
	    if ($('select#address').val()=='')
	    {
	    	swal('Error!','住所入力フィールドを選択して下さい。','error');
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
		    if ($('input#mapheight').val()=='') $('input#mapheight').val('50');
			if (!$.isNumeric($('input#mapheight').val()))
		    {
		    	swal('Error!','一覧地図高さは数値を入力して下さい。','error');
		    	return;
		    }
		    if ($('input#apikey').val()=='')
		    {
		    	swal('Error!','Google Maps APIキーを入力して下さい。','error');
		    	return;
		    }
	    }
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
        config['lat']=$('select#lat').val();
        config['lng']=$('select#lng').val();
        config['spacer']=$('select#spacer').val();
        config['map']=($('input#map').prop('checked'))?'1':'0';
        config['mapheight']=$('input#mapheight').val();
        config['information']=$('select#information').val();
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