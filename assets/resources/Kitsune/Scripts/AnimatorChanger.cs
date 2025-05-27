using UnityEngine;
using System.Collections;

public class AnimatorChanger : MonoBehaviour {

	public GameObject AnimatorToReplace;
	public AnimatorOverrideController AnimatorReplacement;

	public void ChangeAnimator()
	{
		AnimatorToReplace.GetComponent<Animator> ().runtimeAnimatorController = AnimatorReplacement;
		AnimatorToReplace.GetComponent<Animator> ().Play ("Idle");
		AnimatorToReplace.GetComponent<Actions> ().Reset ();
	}
}
