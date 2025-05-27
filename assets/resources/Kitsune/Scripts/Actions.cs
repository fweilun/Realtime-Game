using UnityEngine;
using System.Collections;
using UnityEngine.UI;

public class Actions : MonoBehaviour {


    public enum Action 
    {
        Idle=0,
        Death=8,
        Flinch=7,
        Jump=5,
        Melee=3,
        Run=2,
        Shoot=4,
        SpinAttack=6,
        Walk=1
        
    }

    Animator anim;
    public static Action actualAction = Action.Idle;
    int actualAnim = (int)Action.Idle;
    public Text actText;
    public GameObject Bullet;
	// Use this for initialization
	void Start () {
        
        anim = this.gameObject.GetComponent<Animator>();
        actText.text = actualAction.ToString();
        PlayAnimation();
	}

	public void Reset()
	{
		actualAnim = 1;
		NextAnimation ();
	}

    public void NextAnimation()
    { 
        
		switch(((int)actualAnim))
        {

            case 0:
                actualAction = Action.Idle;
                actualAnim = (int)actualAction;
                break;
            case 1:
                actualAction = Action.Walk;
                actualAnim = (int)actualAction;
                break;
            case 2:
                actualAction = Action.Run;
                actualAnim = (int)actualAction;
                break;

            case 3:
                actualAction = Action.Melee;
                actualAnim = (int)actualAction;
                break;
            case 4:
                actualAction = Action.Shoot;
                actualAnim = (int)actualAction;
                break;
            case 5:
                actualAction = Action.Jump;
                actualAnim = (int)actualAction;
                break;
            case 6:
                actualAction = Action.SpinAttack;
                actualAnim = (int)actualAction;
                break;
            case 7:
                actualAction = Action.Flinch;
                actualAnim = (int)actualAction;
                break;
            case 8:
                actualAction = Action.Death;
                actualAnim = (int)actualAction;
                break;                                     
            default:
                actualAction = Action.Idle;
                actualAnim = (int)actualAction;
                break;
        }

        actText.text = actualAction.ToString();
		anim.Play(actualAction.ToString());
    }


	public void Next()
	{
        Debug.Log("Next");
		actualAnim++;
		NextAnimation ();
	}

	public void Back()
	{
		actualAnim--;
		NextAnimation ();
	}
	
    public void PlayAnimation()
    {
        anim.Play(actualAction.ToString());
    }

    public IEnumerator BackToIdle() 
    {
        yield return new WaitForSeconds(.7f);
        anim.Play(Action.Idle.ToString());
    }
    public void ActiveShoot()
    {
        Bullet.SetActive(true);
    }


}
