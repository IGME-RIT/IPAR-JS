<?php
require_once 'Parsedown.php';

class IPARParsedown extends Parsedown
{
	# Adds an inline element for linking to pages within a help modal
	protected function inlineLink($excerpt)
	{
		if(preg_match('/^\[\[(.*?)\]\](?=$)/', $excerpt['text'], $matches))
		{
			return array(
				'extent' => strlen($matches[0]),
				'element' => array(
					'name' => 'a',
					'handler' => 'line',
					'text' => $matches[1],
					'attributes' => array(
						'href' => '#',
						'title' => $matches[1],
						'onclick' => "setHelpPage('" . $matches[1] . "')"
					)
				)
			);
		}

		return  parent::inlineLink($excerpt);
	}
}
